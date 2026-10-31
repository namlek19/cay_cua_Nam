import { NextResponse } from "next/server";
import { connectDB, DatabaseConfigError, getMemoryFallback } from "@/lib/mongodb";
import { TreeState, Branch } from "@/models/TreeData";
import { getVisitorHash } from "@/lib/serverUtils";

export const dynamic = "force-dynamic";

function sanitizeBranchesForPublic(branches) {
  return branches.map((b) => {
    const raw = b.toObject ? b.toObject() : { ...b };
    const rawNote = typeof raw.note === "string" ? raw.note : "";
    const hasNote = rawNote.trim() !== "";

    if (raw.isPublic === false && hasNote) {
      return {
        _id: String(raw._id),
        dateStr: raw.dateStr,
        name: raw.name,
        waterCountOnBranch: raw.waterCountOnBranch || 1,
        note: "LOCKED_SECRET",
        hasNote: true,
        isPublic: false,
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
      createdAt: raw.createdAt,
    };
  });
}

export async function POST(request) {
  const todayVN = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

  const visitorHash = getVisitorHash(request);

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

    const aggResult = await Branch.aggregate([
      {
        $match: {
          visitorHash,
          dateStr: todayVN,
        },
      },
      {
        $group: {
          _id: null,
          totalToday: { $sum: "$waterCountOnBranch" },
        },
      },
    ]);

    const currentTodayCount = aggResult.length > 0 ? aggResult[0].totalToday : 0;

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

    let targetBranch = null;

    if (cleanNote === "") {
      const existingEmptyBranch = await Branch.findOne({
        visitorHash,
        dateStr: todayVN,
        name: cleanName,
        note: "",
      }).sort({ createdAt: -1 });

      if (existingEmptyBranch) {
        existingEmptyBranch.waterCountOnBranch += 1;
        await existingEmptyBranch.save();
        targetBranch = existingEmptyBranch;
      }
    }

    if (!targetBranch) {
      targetBranch = await Branch.create({
        visitorHash,
        dateStr: todayVN,
        name: cleanName,
        waterCountOnBranch: 1,
        note: cleanNote,
        isPublic: cleanIsPublic,
        createdAt: new Date(),
      });
    }

    let treeState = await TreeState.findOneAndUpdate(
      { key: "main_tree" },
      { $inc: { guestWaterCount: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const allBranches = await Branch.find({}).sort({ createdAt: 1 }).lean();
    const newTodayCount = Math.min(10, currentTodayCount + 1);

    return NextResponse.json({
      ok: true,
      message: "Tưới nước thành công! Cây Phượng Đỏ vừa nhận thêm sức sống.",
      todayVN,
      myTodayWaterCount: newTodayCount,
      treeState: {
        key: treeState.key,
        ownerWaterCount: treeState.ownerWaterCount,
        guestWaterCount: treeState.guestWaterCount,
        totalCount: treeState.ownerWaterCount + treeState.guestWaterCount,
        streak: treeState.streak,
        lastOwnerWaterDate: treeState.lastOwnerWaterDate,
      },
      branches: sanitizeBranchesForPublic(allBranches),
    });
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      const fallback = getMemoryFallback();
      const currentTodayCount = fallback.branches
        .filter((b) => b.visitorHash === visitorHash && b.dateStr === todayVN)
        .reduce((sum, b) => sum + (b.waterCountOnBranch || 1), 0);

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

      let foundBranch = null;
      if (cleanNote === "") {
        for (let i = fallback.branches.length - 1; i >= 0; i--) {
          const item = fallback.branches[i];
          if (
            item.visitorHash === visitorHash &&
            item.dateStr === todayVN &&
            item.name === cleanName &&
            item.note === ""
          ) {
            item.waterCountOnBranch += 1;
            foundBranch = item;
            break;
          }
        }
      }

      if (!foundBranch) {
        foundBranch = {
          _id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          visitorHash,
          dateStr: todayVN,
          name: cleanName,
          waterCountOnBranch: 1,
          note: cleanNote,
          isPublic: cleanIsPublic,
          createdAt: new Date().toISOString(),
        };
        fallback.branches.push(foundBranch);
      }

      fallback.treeState.guestWaterCount += 1;

      const sortedBranches = [...fallback.branches].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      return NextResponse.json({
        ok: true,
        message: "Tưới nước thành công (Chế độ tạm thời - Chưa đổi mật khẩu DB)!",
        todayVN,
        myTodayWaterCount: Math.min(10, currentTodayCount + 1),
        treeState: {
          ...fallback.treeState,
          totalCount:
            fallback.treeState.ownerWaterCount +
            fallback.treeState.guestWaterCount,
        },
        branches: sanitizeBranchesForPublic(sortedBranches),
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

