import { NextResponse } from "next/server";
import { connectDB, DatabaseConfigError, getMemoryFallback } from "@/lib/mongodb";
import { TreeState, Branch } from "@/models/TreeData";
import { getDaysDifference, getVisitorHash } from "@/lib/serverUtils";

export const dynamic = "force-dynamic";

function formatBranchesForClient(branches, isAdmin) {
  return branches.map((b) => {
    const raw = b.toObject ? b.toObject() : { ...b };
    const rawNote = typeof raw.note === "string" ? raw.note : "";
    const hasNote = rawNote.trim() !== "";

    if (!isAdmin && raw.isPublic === false && hasNote) {
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

export async function GET(request) {
  const todayVN = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

  const adminPinHeader = request.headers.get("x-admin-pin") || "";
  const expectedPin = process.env.ADMIN_PIN || "123456";
  const isAdmin = adminPinHeader === expectedPin;
  const visitorHash = getVisitorHash(request);

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

    const rawBranches = await Branch.find({}).sort({ createdAt: 1 }).lean();

    const myTodayBranches = rawBranches.filter(
      (b) => b.visitorHash === visitorHash && b.dateStr === todayVN
    );
    const myTodayWaterCount = Math.min(
      10,
      myTodayBranches.reduce((sum, b) => sum + (b.waterCountOnBranch || 1), 0)
    );

    const branches = formatBranchesForClient(rawBranches, isAdmin);

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
          .filter((b) => b.visitorHash === visitorHash && b.dateStr === todayVN)
          .reduce((sum, b) => sum + (b.waterCountOnBranch || 1), 0)
      );

      return NextResponse.json({
        ok: true,
        todayVN,
        isAdmin,
        treeState: {
          ...memState,
          totalCount: memState.ownerWaterCount + memState.guestWaterCount,
        },
        branches: formatBranchesForClient(sortedBranches, isAdmin),
        myTodayWaterCount,
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

