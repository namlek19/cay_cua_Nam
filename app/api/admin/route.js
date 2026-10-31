import { NextResponse } from "next/server";
import { connectDB, DatabaseConfigError, getMemoryFallback } from "@/lib/mongodb";
import { TreeState, Branch } from "@/models/TreeData";
import { getDaysDifference } from "@/lib/serverUtils";

export const dynamic = "force-dynamic";

function formatAdminBranches(branches) {
  return branches.map((b) => {
    const raw = b.toObject ? b.toObject() : { ...b };
    const rawNote = typeof raw.note === "string" ? raw.note : "";
    return {
      _id: String(raw._id),
      dateStr: raw.dateStr,
      name: raw.name,
      waterCountOnBranch: raw.waterCountOnBranch || 1,
      note: rawNote,
      hasNote: rawNote.trim() !== "",
      isPublic: raw.isPublic !== false,
      createdAt: raw.createdAt,
    };
  });
}

export async function POST(request) {
  const todayVN = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { action, pin } = body;
  const expectedPin = process.env.ADMIN_PIN || "123456";

  if (!pin || String(pin) !== String(expectedPin)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Mã PIN 6 số không chính xác! Vui lòng thử lại.",
      },
      { status: 401 }
    );
  }

  if (action !== "verify" && action !== "water") {
    return NextResponse.json(
      {
        ok: false,
        error: "Hành động không hợp lệ.",
      },
      { status: 400 }
    );
  }

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

    if (action === "verify") {
      if (treeState.lastOwnerWaterDate) {
        const diffDays = getDaysDifference(
          todayVN,
          treeState.lastOwnerWaterDate
        );
        if (diffDays !== null && diffDays > 1 && treeState.streak !== 0) {
          treeState.streak = 0;
          await treeState.save();
        }
      }

      const rawBranches = await Branch.find({}).sort({ createdAt: 1 }).lean();

      return NextResponse.json({
        ok: true,
        isAdmin: true,
        todayVN,
        message: "Mở khóa khu vườn Chủ Vườn thành công!",
        treeState: {
          key: treeState.key,
          ownerWaterCount: treeState.ownerWaterCount,
          guestWaterCount: treeState.guestWaterCount,
          totalCount: treeState.ownerWaterCount + treeState.guestWaterCount,
          streak: treeState.streak,
          lastOwnerWaterDate: treeState.lastOwnerWaterDate,
        },
        branches: formatAdminBranches(rawBranches),
      });
    }

    if (action === "water") {
      treeState.ownerWaterCount += 1;

      const lastDate = treeState.lastOwnerWaterDate;
      if (lastDate === null) {
        treeState.streak = 1;
        treeState.lastOwnerWaterDate = todayVN;
      } else if (lastDate === todayVN) {
        // Hôm nay đã tưới rồi, giữ nguyên streak, chỉ tăng ownerWaterCount
      } else {
        const diffDays = getDaysDifference(todayVN, lastDate);
        if (diffDays === 1) {
          treeState.streak += 1;
          treeState.lastOwnerWaterDate = todayVN;
        } else {
          treeState.streak = 1;
          treeState.lastOwnerWaterDate = todayVN;
        }
      }

      await treeState.save();

      const rawBranches = await Branch.find({}).sort({ createdAt: 1 }).lean();

      return NextResponse.json({
        ok: true,
        isAdmin: true,
        todayVN,
        message: "Chủ vườn đã tưới nước thành công!",
        treeState: {
          key: treeState.key,
          ownerWaterCount: treeState.ownerWaterCount,
          guestWaterCount: treeState.guestWaterCount,
          totalCount: treeState.ownerWaterCount + treeState.guestWaterCount,
          streak: treeState.streak,
          lastOwnerWaterDate: treeState.lastOwnerWaterDate,
        },
        branches: formatAdminBranches(rawBranches),
      });
    }
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      const fallback = getMemoryFallback();
      const memState = fallback.treeState;

      if (action === "verify") {
        if (memState.lastOwnerWaterDate) {
          const diffDays = getDaysDifference(
            todayVN,
            memState.lastOwnerWaterDate
          );
          if (diffDays !== null && diffDays > 1) {
            memState.streak = 0;
          }
        }
      } else if (action === "water") {
        memState.ownerWaterCount += 1;
        const lastDate = memState.lastOwnerWaterDate;
        if (lastDate === null) {
          memState.streak = 1;
          memState.lastOwnerWaterDate = todayVN;
        } else if (lastDate === todayVN) {
          // Giữ nguyên streak
        } else {
          const diffDays = getDaysDifference(todayVN, lastDate);
          if (diffDays === 1) {
            memState.streak += 1;
            memState.lastOwnerWaterDate = todayVN;
          } else {
            memState.streak = 1;
            memState.lastOwnerWaterDate = todayVN;
          }
        }
      }

      const sortedBranches = [...fallback.branches].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      return NextResponse.json({
        ok: true,
        isAdmin: true,
        todayVN,
        message:
          action === "verify"
            ? "Mở khóa Chủ Vườn thành công (Chế độ tạm thời)!"
            : "Chủ vườn đã tưới nước thành công (Chế độ tạm thời)!",
        treeState: {
          ...memState,
          totalCount: memState.ownerWaterCount + memState.guestWaterCount,
        },
        branches: formatAdminBranches(sortedBranches),
        dbConfigWarning: {
          message: error.message,
          guide: error.guide,
        },
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Lỗi máy chủ khi xử lý tác vụ Chủ vườn.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

