import { NextResponse } from "next/server";
import { connectDB, DatabaseConfigError, getMemoryFallback } from "@/lib/mongodb";
import { TreeState, Branch } from "@/models/TreeData";
import {
  getDaysDifference,
  getVisitorHash,
  getLegacyVisitorHash,
  ensureFlowerPosition,
} from "@/lib/serverUtils";

export const dynamic = "force-dynamic";

function formatBranchesForClient(branches, isAdmin, hashSet = [], todayVN = "") {
  return branches.map((b, idx) => {
    const raw = b.toObject ? b.toObject() : { ...b };
    const rawNote = typeof raw.note === "string" ? raw.note : "";
    const hasNote = rawNote.trim() !== "";
    const isMineToday = Boolean(
      hashSet.includes(raw.visitorHash) && raw.dateStr === todayVN
    );
    const { posX, posY } = ensureFlowerPosition(raw, idx);

    if (!isAdmin && !isMineToday && raw.isPublic === false && hasNote) {
      return {
        _id: String(raw._id),
        dateStr: raw.dateStr,
        name: raw.name,
        waterCountOnBranch: raw.waterCountOnBranch || 1,
        note: "LOCKED_SECRET",
        hasNote: true,
        isPublic: false,
        isMineToday,
        posX,
        posY,
        createdAt: raw.createdAt,
      };
    }

    return {
      _id: String(raw._id),
      dateStr: raw.dateStr,
      name: raw.name,
      waterCountOnBranch: raw.waterCountOnBranch || 1,
      note: rawNote,
      hasNote,
      isPublic: raw.isPublic !== false,
      isMineToday,
      posX,
      posY,
      createdAt: raw.createdAt,
    };
  });
}

async function consolidateDuplicateBranchesInDB(
  primaryHash,
  legacyHash,
  todayVN
) {
  const hashSet = Array.from(new Set([primaryHash, legacyHash].filter(Boolean)));
  if (hashSet.length > 0) {
    const myTodayDocs = await Branch.find({
      visitorHash: { $in: hashSet },
      dateStr: todayVN,
    }).sort({ createdAt: 1 });

    if (myTodayDocs.length > 1) {
      const keeper = myTodayDocs[0];
      let totalWater = 0;
      let chosenName = keeper.name;
      let chosenNote = keeper.note || "";
      let chosenIsPublic = keeper.isPublic !== false;

      for (const doc of myTodayDocs) {
        totalWater += doc.waterCountOnBranch || 1;
        if (doc.name && doc.name.trim() !== "") {
          chosenName = doc.name;
        }
        if (doc.note && doc.note.trim() !== "") {
          chosenNote = doc.note;
          chosenIsPublic = doc.isPublic !== false;
        }
      }

      keeper.visitorHash = primaryHash;
      keeper.waterCountOnBranch = totalWater;
      keeper.name = chosenName;
      keeper.note = chosenNote;
      keeper.isPublic = chosenIsPublic;
      await keeper.save();

      const duplicateIds = myTodayDocs.slice(1).map((d) => d._id);
      await Branch.deleteMany({ _id: { $in: duplicateIds } });
    } else if (
      myTodayDocs.length === 1 &&
      myTodayDocs[0].visitorHash !== primaryHash
    ) {
      myTodayDocs[0].visitorHash = primaryHash;
      await myTodayDocs[0].save();
    }
  }

  const allDocs = await Branch.find({}).sort({ createdAt: 1 });
  const grouped = new Map();
  const idsToDelete = [];

  for (const doc of allDocs) {
    const key = `${doc.visitorHash}_${doc.dateStr}`;
    if (!grouped.has(key)) {
      grouped.set(key, doc);
    } else {
      const keeper = grouped.get(key);
      keeper.waterCountOnBranch =
        (keeper.waterCountOnBranch || 1) + (doc.waterCountOnBranch || 1);
      if (doc.name && doc.name.trim() !== "") {
        keeper.name = doc.name;
      }
      if (doc.note && doc.note.trim() !== "") {
        keeper.note = doc.note;
        keeper.isPublic = doc.isPublic !== false;
      }
      keeper._needsSave = true;
      idsToDelete.push(doc._id);
    }
  }

  for (const doc of grouped.values()) {
    if (doc._needsSave) {
      await doc.save();
    }
  }

  if (idsToDelete.length > 0) {
    await Branch.deleteMany({ _id: { $in: idsToDelete } });
  }
}

function extractMyTodayNote(branches, hashSet, todayVN) {
  const myBranchesToday = branches.filter(
    (b) => hashSet.includes(b.visitorHash) && b.dateStr === todayVN
  );
  if (myBranchesToday.length === 0) return null;

  const target =
    myBranchesToday.find(
      (b) => typeof b.note === "string" && b.note.trim() !== ""
    ) || myBranchesToday[0];

  const rawNote = typeof target.note === "string" ? target.note.trim() : "";

  return {
    _id: String(target._id),
    name: target.name || "",
    isAnonymous: !target.name || target.name.trim() === "",
    note: rawNote,
    hasNote: rawNote !== "",
    isPublic: target.isPublic !== false,
  };
}

export async function GET(request) {
  const todayVN = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

  const adminPinHeader = request.headers.get("x-admin-pin") || "";
  const expectedPin = process.env.ADMIN_PIN || "123456";
  const isAdmin = adminPinHeader === expectedPin;

  const visitorHash = getVisitorHash(request);
  const legacyHash = getLegacyVisitorHash(request);
  const hashSet = Array.from(new Set([visitorHash, legacyHash].filter(Boolean)));

  try {
    await connectDB();

    let treeState = await TreeState.findOne({ key: "main_tree" });
    if (!treeState) {
      treeState = await TreeState.create({
        key: "main_tree",
        ownerWaterCount: 0,
        guestWaterCount: 0,
        streak: 0,
        lastOwnerWaterDate: null,
      });
    }

    if (treeState.lastOwnerWaterDate) {
      const diffDays = getDaysDifference(todayVN, treeState.lastOwnerWaterDate);
      if (diffDays !== null && diffDays > 1 && treeState.streak !== 0) {
        treeState.streak = 0;
        await treeState.save();
      }
    }

    await consolidateDuplicateBranchesInDB(visitorHash, legacyHash, todayVN);

    const rawBranches = await Branch.find({}).sort({ createdAt: 1 }).lean();

    const myTodayBranches = rawBranches.filter(
      (b) => hashSet.includes(b.visitorHash) && b.dateStr === todayVN
    );
    const myTodayWaterCount = Math.min(
      10,
      myTodayBranches.reduce((sum, b) => sum + (b.waterCountOnBranch || 1), 0)
    );
    const myTodayNote = extractMyTodayNote(rawBranches, hashSet, todayVN);

    const branches = formatBranchesForClient(
      rawBranches,
      isAdmin,
      hashSet,
      todayVN
    );

    return NextResponse.json({
      ok: true,
      todayVN,
      isAdmin,
      treeState: {
        key: treeState.key,
        ownerWaterCount: treeState.ownerWaterCount,
        guestWaterCount: treeState.guestWaterCount,
        totalCount: treeState.ownerWaterCount + treeState.guestWaterCount,
        streak: treeState.streak,
        lastOwnerWaterDate: treeState.lastOwnerWaterDate,
      },
      branches,
      myTodayWaterCount,
      myTodayNote,
      dbConfigWarning: null,
    });
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      const fallback = getMemoryFallback();
      const memState = fallback.treeState;

      if (memState.lastOwnerWaterDate) {
        const diffDays = getDaysDifference(todayVN, memState.lastOwnerWaterDate);
        if (diffDays !== null && diffDays > 1) {
          memState.streak = 0;
        }
      }

      const sortedBranches = [...fallback.branches].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      const myTodayWaterCount = Math.min(
        10,
        sortedBranches
          .filter(
            (b) => hashSet.includes(b.visitorHash) && b.dateStr === todayVN
          )
          .reduce((sum, b) => sum + (b.waterCountOnBranch || 1), 0)
      );
      const myTodayNote = extractMyTodayNote(sortedBranches, hashSet, todayVN);

      return NextResponse.json({
        ok: true,
        todayVN,
        isAdmin,
        treeState: {
          ...memState,
          totalCount: memState.ownerWaterCount + memState.guestWaterCount,
        },
        branches: formatBranchesForClient(
          sortedBranches,
          isAdmin,
          hashSet,
          todayVN
        ),
        myTodayWaterCount,
        myTodayNote,
        dbConfigWarning: {
          message: error.message,
          guide: error.guide,
        },
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Đã xảy ra lỗi khi tải dữ liệu Cây Phượng Đỏ.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
