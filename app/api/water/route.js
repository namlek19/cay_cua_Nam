import { NextResponse } from "next/server";
import { connectDB, DatabaseConfigError, getMemoryFallback } from "@/lib/mongodb";
import { TreeState, Branch } from "@/models/TreeData";
import {
  getVisitorHash,
  getLegacyVisitorHash,
  generateRandomLawnPos,
  ensureFlowerPosition,
} from "@/lib/serverUtils";

export const dynamic = "force-dynamic";

function sanitizeBranchesForPublic(branches, hashSet = [], todayVN = "") {
  return branches.map((b, idx) => {
    const raw = b.toObject ? b.toObject() : { ...b };
    const rawNote = typeof raw.note === "string" ? raw.note : "";
    const hasNote = rawNote.trim() !== "";
    const isMineToday = Boolean(
      hashSet.includes(raw.visitorHash) && raw.dateStr === todayVN
    );
    const { posX, posY } = ensureFlowerPosition(raw, idx);

    if (!isMineToday && raw.isPublic === false && hasNote) {
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

export async function POST(request) {
  const todayVN = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

  const visitorHash = getVisitorHash(request);
  const legacyHash = getLegacyVisitorHash(request);
  const hashSet = Array.from(new Set([visitorHash, legacyHash].filter(Boolean)));

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { name, isAnonymous, note, isPublic } = body;

  const cleanName =
    isAnonymous || !name?.trim() ? null : name.trim().slice(0, 40);
  const cleanNote = note ? note.trim().slice(0, 500) : "";
  const cleanIsPublic = isPublic === false ? false : true;

  try {
    await connectDB();

    const myTodayDocs = await Branch.find({
      visitorHash: { $in: hashSet },
      dateStr: todayVN,
    }).sort({ createdAt: 1 });

    const currentTodayCount = myTodayDocs.reduce(
      (sum, b) => sum + (b.waterCountOnBranch || 1),
      0
    );

    if (currentTodayCount >= 10) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Hôm nay bạn đã tưới đủ 10/10 lần rồi, mai quay lại tưới tiếp nhé!",
          myTodayWaterCount: currentTodayCount,
        },
        { status: 429 }
      );
    }

    if (myTodayDocs.length > 0) {
      const keeper = myTodayDocs[0];
      let mergedWater = currentTodayCount + 1;
      let existingNote = keeper.note || "";
      let existingName = keeper.name;
      let existingPublic = keeper.isPublic !== false;

      for (const doc of myTodayDocs) {
        if (doc.note && doc.note.trim() !== "") {
          existingNote = doc.note;
          existingPublic = doc.isPublic !== false;
        }
        if (doc.name && doc.name.trim() !== "") {
          existingName = doc.name;
        }
      }

      if (typeof keeper.posX !== "number" || typeof keeper.posY !== "number") {
        const allExisting = await Branch.find({}).lean();
        const { posX, posY } = generateRandomLawnPos(allExisting);
        keeper.posX = posX;
        keeper.posY = posY;
      }

      keeper.visitorHash = visitorHash;
      keeper.waterCountOnBranch = mergedWater;
      if (!existingName && cleanName) {
        keeper.name = cleanName;
      } else {
        keeper.name = existingName;
      }

      if (!existingNote || existingNote.trim() === "") {
        if (cleanNote !== "") {
          keeper.note = cleanNote;
          keeper.isPublic = cleanIsPublic;
        }
      } else {
        keeper.note = existingNote;
        keeper.isPublic = existingPublic;
      }

      await keeper.save();

      if (myTodayDocs.length > 1) {
        const extraIds = myTodayDocs.slice(1).map((d) => d._id);
        await Branch.deleteMany({ _id: { $in: extraIds } });
      }
    } else {
      const allExisting = await Branch.find({}).lean();
      const { posX, posY } = generateRandomLawnPos(allExisting);

      await Branch.create({
        visitorHash,
        dateStr: todayVN,
        name: cleanName,
        waterCountOnBranch: 1,
        note: cleanNote,
        isPublic: cleanIsPublic,
        posX,
        posY,
        createdAt: new Date(),
      });
    }

    const treeState = await TreeState.findOneAndUpdate(
      { key: "main_tree" },
      { $inc: { guestWaterCount: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const allBranches = await Branch.find({}).sort({ createdAt: 1 }).lean();
    const newTodayCount = Math.min(10, currentTodayCount + 1);
    const myTodayNote = extractMyTodayNote(allBranches, hashSet, todayVN);

    return NextResponse.json({
      ok: true,
      message: "Tưới nước thành công!",
      todayVN,
      myTodayWaterCount: newTodayCount,
      myTodayNote,
      treeState: {
        key: treeState.key,
        ownerWaterCount: treeState.ownerWaterCount,
        guestWaterCount: treeState.guestWaterCount,
        totalCount: treeState.ownerWaterCount + treeState.guestWaterCount,
        streak: treeState.streak,
        lastOwnerWaterDate: treeState.lastOwnerWaterDate,
      },
      branches: sanitizeBranchesForPublic(allBranches, hashSet, todayVN),
    });
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      const fallback = getMemoryFallback();
      const myBranches = fallback.branches.filter(
        (b) => hashSet.includes(b.visitorHash) && b.dateStr === todayVN
      );
      const currentTodayCount = myBranches.reduce(
        (sum, b) => sum + (b.waterCountOnBranch || 1),
        0
      );

      if (currentTodayCount >= 10) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Hôm nay bạn đã tưới đủ 10/10 lần rồi, mai quay lại tưới tiếp nhé!",
            myTodayWaterCount: currentTodayCount,
          },
          { status: 429 }
        );
      }

      if (myBranches.length > 0) {
        const keeper = myBranches[0];
        keeper.visitorHash = visitorHash;
        keeper.waterCountOnBranch = currentTodayCount + 1;
        if (!keeper.name && cleanName) keeper.name = cleanName;
        if ((!keeper.note || keeper.note.trim() === "") && cleanNote !== "") {
          keeper.note = cleanNote;
          keeper.isPublic = cleanIsPublic;
        }
        if (myBranches.length > 1) {
          const extraIds = new Set(myBranches.slice(1).map((d) => d._id));
          fallback.branches = fallback.branches.filter(
            (b) => !extraIds.has(b._id)
          );
        }
      } else {
        const { posX, posY } = generateRandomLawnPos(fallback.branches);
        fallback.branches.push({
          _id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          visitorHash,
          dateStr: todayVN,
          name: cleanName,
          waterCountOnBranch: 1,
          note: cleanNote,
          isPublic: cleanIsPublic,
          posX,
          posY,
          createdAt: new Date().toISOString(),
        });
      }

      fallback.treeState.guestWaterCount += 1;

      const sortedBranches = [...fallback.branches].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      const myTodayNote = extractMyTodayNote(sortedBranches, hashSet, todayVN);

      return NextResponse.json({
        ok: true,
        message: "Tưới nước thành công!",
        todayVN,
        myTodayWaterCount: Math.min(10, currentTodayCount + 1),
        myTodayNote,
        treeState: {
          ...fallback.treeState,
          totalCount:
            fallback.treeState.ownerWaterCount +
            fallback.treeState.guestWaterCount,
        },
        branches: sanitizeBranchesForPublic(sortedBranches, hashSet, todayVN),
        dbConfigWarning: {
          message: error.message,
          guide: error.guide,
        },
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Không thể thực hiện tưới cây lúc này.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const todayVN = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

  const visitorHash = getVisitorHash(request);
  const legacyHash = getLegacyVisitorHash(request);
  const hashSet = Array.from(new Set([visitorHash, legacyHash].filter(Boolean)));

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { name, isAnonymous, note, isPublic, updateNameOnly } = body;
  const cleanName =
    isAnonymous || !name?.trim() ? null : name.trim().slice(0, 40);
  const cleanNote = typeof note === "string" ? note.trim().slice(0, 500) : "";
  const cleanIsPublic = cleanNote ? (isPublic === false ? false : true) : true;

  try {
    await connectDB();

    const myTodayDocs = await Branch.find({
      visitorHash: { $in: hashSet },
      dateStr: todayVN,
    }).sort({ createdAt: 1 });

    // Nếu chỉ cập nhật tên / chế độ ẩn danh cho bông hoa của lượt tưới hôm nay (không đụng tới note hiện có)
    if (updateNameOnly) {
      if (myTodayDocs.length > 0) {
        const keeper = myTodayDocs[0];
        keeper.visitorHash = visitorHash;
        keeper.name = cleanName;
        await keeper.save();
      }
      const allBranches = await Branch.find({}).sort({ createdAt: 1 }).lean();
      const myTodayNote = extractMyTodayNote(allBranches, hashSet, todayVN);
      return NextResponse.json({
        ok: true,
        message: "Đã cập nhật tên người tưới!",
        myTodayNote,
        branches: sanitizeBranchesForPublic(allBranches, hashSet, todayVN),
      });
    }

    if (myTodayDocs.length > 0) {
      const keeper = myTodayDocs[0];
      const totalWater = myTodayDocs.reduce(
        (sum, b) => sum + (b.waterCountOnBranch || 1),
        0
      );

      keeper.visitorHash = visitorHash;
      keeper.waterCountOnBranch = totalWater;
      keeper.name = cleanName;
      keeper.note = cleanNote;
      keeper.isPublic = cleanIsPublic;
      await keeper.save();

      if (myTodayDocs.length > 1) {
        const extraIds = myTodayDocs.slice(1).map((d) => d._id);
        await Branch.deleteMany({ _id: { $in: extraIds } });
      }
    } else {
      const allExisting = await Branch.find({}).lean();
      const { posX, posY } = generateRandomLawnPos(allExisting);

      await Branch.create({
        visitorHash,
        dateStr: todayVN,
        name: cleanName,
        waterCountOnBranch: 1,
        note: cleanNote,
        isPublic: cleanIsPublic,
        posX,
        posY,
        createdAt: new Date(),
      });
    }

    const allBranches = await Branch.find({}).sort({ createdAt: 1 }).lean();
    const myTodayNote = extractMyTodayNote(allBranches, hashSet, todayVN);

    return NextResponse.json({
      ok: true,
      message: cleanNote
        ? "Đã lưu lời nhắn & tên hiển thị của bạn!"
        : "Đã cập nhật tên hiển thị trên bông hoa!",
      myTodayNote,
      branches: sanitizeBranchesForPublic(allBranches, hashSet, todayVN),
    });
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      const fallback = getMemoryFallback();
      const myBranchesToday = fallback.branches.filter(
        (b) => hashSet.includes(b.visitorHash) && b.dateStr === todayVN
      );

      if (updateNameOnly) {
        if (myBranchesToday.length > 0) {
          myBranchesToday[0].visitorHash = visitorHash;
          myBranchesToday[0].name = cleanName;
        }
        const sortedBranches = [...fallback.branches].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        const myTodayNote = extractMyTodayNote(
          sortedBranches,
          hashSet,
          todayVN
        );
        return NextResponse.json({
          ok: true,
          message: "Đã cập nhật tên người tưới!",
          myTodayNote,
          branches: sanitizeBranchesForPublic(sortedBranches, hashSet, todayVN),
        });
      }

      if (myBranchesToday.length > 0) {
        const keeper = myBranchesToday[0];
        keeper.visitorHash = visitorHash;
        keeper.name = cleanName;
        keeper.note = cleanNote;
        keeper.isPublic = cleanIsPublic;
      } else {
        const { posX, posY } = generateRandomLawnPos(fallback.branches);
        fallback.branches.push({
          _id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          visitorHash,
          dateStr: todayVN,
          name: cleanName,
          waterCountOnBranch: 1,
          note: cleanNote,
          isPublic: cleanIsPublic,
          posX,
          posY,
          createdAt: new Date().toISOString(),
        });
      }

      const sortedBranches = [...fallback.branches].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      const myTodayNote = extractMyTodayNote(sortedBranches, hashSet, todayVN);

      return NextResponse.json({
        ok: true,
        message: cleanNote
          ? "Đã lưu lời nhắn & tên hiển thị của bạn!"
          : "Đã cập nhật tên hiển thị trên bông hoa!",
        myTodayNote,
        branches: sanitizeBranchesForPublic(sortedBranches, hashSet, todayVN),
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Không thể lưu lời nhắn lúc này.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const todayVN = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

  const visitorHash = getVisitorHash(request);
  const legacyHash = getLegacyVisitorHash(request);
  const hashSet = Array.from(new Set([visitorHash, legacyHash].filter(Boolean)));

  try {
    await connectDB();

    await Branch.updateMany(
      { visitorHash: { $in: hashSet }, dateStr: todayVN },
      { $set: { note: "", isPublic: true } }
    );

    const allBranches = await Branch.find({}).sort({ createdAt: 1 }).lean();
    const myTodayNote = extractMyTodayNote(allBranches, hashSet, todayVN);

    return NextResponse.json({
      ok: true,
      message: "Đã xóa lời nhắn của bạn.",
      myTodayNote,
      branches: sanitizeBranchesForPublic(allBranches, hashSet, todayVN),
    });
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      const fallback = getMemoryFallback();
      fallback.branches.forEach((b) => {
        if (hashSet.includes(b.visitorHash) && b.dateStr === todayVN) {
          b.note = "";
          b.isPublic = true;
        }
      });

      const sortedBranches = [...fallback.branches].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      const myTodayNote = extractMyTodayNote(sortedBranches, hashSet, todayVN);

      return NextResponse.json({
        ok: true,
        message: "Đã xóa lời nhắn của bạn.",
        myTodayNote,
        branches: sanitizeBranchesForPublic(sortedBranches, hashSet, todayVN),
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Không thể xóa lời nhắn lúc này.",
      },
      { status: 500 }
    );
  }
}
