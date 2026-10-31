import { NextResponse } from "next/server";
import { connectDB, DatabaseConfigError, getMemoryFallback } from "@/lib/mongodb";
import { TreeState, Branch } from "@/models/TreeData";
import { getDaysDifference, ensureFlowerPosition } from "@/lib/serverUtils";

export const dynamic = "force-dynamic";

function formatAdminBranches(branches) {
  return branches.map((b, idx) => {
    const raw = b.toObject ? b.toObject() : { ...b };
    const rawNote = typeof raw.note === "string" ? raw.note : "";
    const { posX, posY } = ensureFlowerPosition(raw, idx);

    return {
      _id: String(raw._id),
      dateStr: raw.dateStr,
      name: raw.name,
      waterCountOnBranch: raw.waterCountOnBranch || 1,
      note: rawNote,
      hasNote: rawNote.trim() !== "",
      isPublic: raw.isPublic !== false,
      posX,
      posY,
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
        ownerWateredToday: treeState.lastOwnerWaterDate === todayVN,
        message: "Mở khóa khu vườn thành công!",
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
      const lastDate = treeState.lastOwnerWaterDate;

      // Nam chỉ được tưới 1 lần / ngày
      if (lastDate === todayVN) {
        return NextResponse.json(
          {
            ok: false,
            alreadyWateredToday: true,
            ownerWateredToday: true,
            error:
              "Hôm nay bạn đã tưới cây rồi (1 lần/ngày). Hãy quay lại vào ngày mai nhé!",
          },
          { status: 429 }
        );
      }

      treeState.ownerWaterCount += 1;

      if (lastDate === null) {
        treeState.streak = 1;
        treeState.lastOwnerWaterDate = todayVN;
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
        ownerWateredToday: true,
        message: "Nam đã tưới nước thành công!",
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
        const lastDate = memState.lastOwnerWaterDate;
        if (lastDate === todayVN) {
          return NextResponse.json(
            {
              ok: false,
              alreadyWateredToday: true,
              ownerWateredToday: true,
              error:
                "Hôm nay bạn đã tưới cây rồi (1 lần/ngày). Hãy quay lại vào ngày mai nhé!",
            },
            { status: 429 }
          );
        }

        memState.ownerWaterCount += 1;
        if (lastDate === null) {
          memState.streak = 1;
          memState.lastOwnerWaterDate = todayVN;
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
        ownerWateredToday: memState.lastOwnerWaterDate === todayVN,
        message:
          action === "verify"
            ? "Mở khóa thành công!"
            : "Nam đã tưới nước thành công!",
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
        error: "Lỗi máy chủ khi xử lý tác vụ.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
