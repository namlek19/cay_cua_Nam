"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { getTreeStageInfo } from "@/lib/treeConfig";

const FLOWERS_PER_PAGE = 6;

// 6 vùng tọa độ chuẩn trên sân cỏ (3 bên trái cây, 3 bên phải cây) kết hợp độ lệch ngẫu nhiên từ server để hoa mọc tự nhiên mà KHÔNG BAO GIỜ đè nhau
const LAWN_SLOTS = [
  { baseX: 16, baseY: 18 },
  { baseX: 64, baseY: 19 },
  { baseX: 27, baseY: 12 },
  { baseX: 75, baseY: 13 },
  { baseX: 38, baseY: 19.5 },
  { baseX: 85, baseY: 18.5 },
];

function getSlotCoords(branch, slotIdx) {
  const slot = LAWN_SLOTS[slotIdx % LAWN_SLOTS.length];
  const rawX = typeof branch.posX === "number" ? branch.posX : slot.baseX;
  const rawY = typeof branch.posY === "number" ? branch.posY : slot.baseY;

  // Tạo độ lệch nhỏ (-2.5% .. +2.5%) từ tọa độ ngẫu nhiên của server quanh ô chuẩn để mọi máy PC & Mobile đều thấy giống nhau và không bao giờ chồng chéo
  const jitterX = ((Math.round(rawX * 10) % 50) - 25) / 10;
  const jitterY = ((Math.round(rawY * 10) % 36) - 18) / 10;

  return {
    x: Number((slot.baseX + jitterX).toFixed(2)),
    y: Number((slot.baseY + jitterY).toFixed(2)),
  };
}

function RedFlowerSvg({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M32 34C32 48 31 62 32 74"
        stroke="#15803d"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M31 56C22 54 16 47 18 42C23 42 29 48 31 56Z"
        fill="#22c55e"
        stroke="#15803d"
        strokeWidth="1.5"
      />
      <path
        d="M33 52C42 50 48 43 46 38C41 38 35 44 33 52Z"
        fill="#22c55e"
        stroke="#15803d"
        strokeWidth="1.5"
      />
      <circle
        cx="32"
        cy="14"
        r="10"
        fill="#ef4444"
        stroke="#b91c1c"
        strokeWidth="1.5"
      />
      <circle
        cx="45"
        cy="23"
        r="10"
        fill="#dc2626"
        stroke="#991b1b"
        strokeWidth="1.5"
      />
      <circle
        cx="40"
        cy="38"
        r="10"
        fill="#ef4444"
        stroke="#b91c1c"
        strokeWidth="1.5"
      />
      <circle
        cx="24"
        cy="38"
        r="10"
        fill="#dc2626"
        stroke="#991b1b"
        strokeWidth="1.5"
      />
      <circle
        cx="19"
        cy="23"
        r="10"
        fill="#ef4444"
        stroke="#b91c1c"
        strokeWidth="1.5"
      />
      <circle
        cx="32"
        cy="27"
        r="6.5"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function PhoenixTreeStage({
  totalCount = 0,
  branches = [],
  isAdmin = false,
  isWatering = false,
  disabledWater = false,
  onWaterClick,
  onOpenScroll,
  onClickMyBranch,
}) {
  const stageInfo = useMemo(() => getTreeStageInfo(totalCount), [totalCount]);

  const totalPages = Math.max(1, Math.ceil(branches.length / FLOWERS_PER_PAGE));
  const [currentPage, setCurrentPage] = useState(totalPages - 1);
  const [activeFlowerId, setActiveFlowerId] = useState(null);

  // Tự động nhảy tới trang mới nhất khi có thêm hoa mới
  useEffect(() => {
    setCurrentPage(
      Math.max(0, Math.ceil(branches.length / FLOWERS_PER_PAGE) - 1)
    );
  }, [branches.length]);

  const safePage = Math.min(Math.max(0, currentPage), totalPages - 1);
  const currentFlowers = useMemo(() => {
    const start = safePage * FLOWERS_PER_PAGE;
    return branches.slice(start, start + FLOWERS_PER_PAGE);
  }, [branches, safePage]);

  return (
    <>
      {/* 1. Cây Phượng Đỏ đứng giữa sân cỏ & Icon Bình tưới đặt ngay cạnh gốc cây */}
      <div
        className="TreeContainer pointer-events-none z-10"
        style={{
          position: "absolute",
          bottom: "11%",
          left: "50%",
          transform: "translateX(-50%)",
          aspectRatio: "600 / 700",
          height: "min(72dvh, 80vw)",
        }}
      >
        <motion.div
          animate={{
            scaleX: isWatering
              ? [
                  stageInfo.microScale,
                  stageInfo.microScale * 1.045,
                  stageInfo.microScale * 0.98,
                  stageInfo.microScale,
                ]
              : stageInfo.microScale,
            scaleY: isWatering
              ? [
                  stageInfo.microScale,
                  stageInfo.microScale * 0.95,
                  stageInfo.microScale * 1.04,
                  stageInfo.microScale,
                ]
              : stageInfo.microScale,
          }}
          transition={{
            duration: isWatering ? 0.85 : 0.5,
            ease: "easeInOut",
          }}
          style={{
            transformOrigin: "bottom center",
          }}
          className="relative h-full w-full"
        >
          <img
            src={stageInfo.img}
            alt={stageInfo.title}
            draggable={false}
            className="pointer-events-none relative z-10 h-full w-full object-contain object-bottom select-none drop-shadow-[0_12px_25px_rgba(0,0,0,0.38)]"
          />
        </motion.div>

        {/* Icon Bình tưới nước đặt ngay cạnh gốc cây (Bấm vào là tưới) */}
        <motion.button
          type="button"
          onClick={onWaterClick}
          disabled={disabledWater || isWatering}
          title="Bấm để tưới nước cho cây"
          whileHover={{ scale: 1.1, rotate: -8 }}
          whileTap={{ scale: 0.92 }}
          animate={
            isWatering
              ? {
                  y: [-5, -55, -50, 0],
                  x: [0, -28, -24, 0],
                  rotate: [0, -34, -28, 0],
                  scale: [1, 1.08, 1.05, 1],
                }
              : {
                  y: [0, -4, 0],
                  x: 0,
                  rotate: 0,
                  scale: 1,
                }
          }
          transition={
            isWatering
              ? { duration: 1.5, ease: "easeInOut" }
              : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
          }
          style={{
            position: "absolute",
            bottom: "1.5%",
            left: "56%",
          }}
          className="pointer-events-auto z-30 flex cursor-pointer flex-col items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img
            src="/assets/watering_can.png"
            alt="Tưới nước"
            draggable={false}
            className="h-14 w-14 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)] sm:h-20 sm:w-20"
          />

          <AnimatePresence>
            {isWatering && (
              <div className="pointer-events-none absolute -bottom-8 -left-8 flex gap-1.5">
                {[0, 1, 2, 3, 4].map((dropIdx) => (
                  <motion.span
                    key={dropIdx}
                    initial={{ opacity: 0, y: -8, x: 0, scale: 0.6 }}
                    animate={{
                      opacity: [0, 1, 0.9, 0],
                      y: [0, 38, 65],
                      x: [-dropIdx * 4, -14 - dropIdx * 6],
                      scale: [0.7, 1.1, 0.5],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: 2,
                      delay: dropIdx * 0.1,
                      ease: "easeIn",
                    }}
                    className="block h-3 w-1.5 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.95)]"
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* 2. Những bông hoa màu đỏ trên sân cỏ (Phân trang 6 bông/trang để không bao giờ đè nhau) */}
      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        {currentFlowers.map((branch, slotIdx) => {
          const { x: posX, y: posY } = getSlotCoords(branch, slotIdx);

          const fullName =
            branch.name && branch.name.trim() !== ""
              ? branch.name
              : "Người ẩn danh";
          const shortName =
            branch.name && branch.name.trim() !== ""
              ? branch.name.length > 10
                ? `${branch.name.slice(0, 10)}…`
                : branch.name
              : "Ẩn danh";

          const waterTimes = branch.waterCountOnBranch || 1;
          const hasNote = Boolean(
            branch.hasNote || (branch.note && branch.note.trim() !== "")
          );
          const isPublic = branch.isPublic !== false;
          const canClickFlowerToNote = !isAdmin && Boolean(branch.isMineToday);
          const isExpanded =
            activeFlowerId === branch._id || Boolean(branch.isMineToday);

          return (
            <div
              key={branch._id || slotIdx}
              onMouseEnter={() => setActiveFlowerId(branch._id)}
              onMouseLeave={() =>
                setActiveFlowerId((prev) =>
                  prev === branch._id ? null : prev
                )
              }
              style={{
                position: "absolute",
                left: `${posX}%`,
                bottom: `${posY}%`,
                transform: "translateX(-50%)",
              }}
              className="group pointer-events-auto flex flex-col items-center"
            >
              {/* Khu vực Bông hoa đung đưa trong gió + Dấu ! nhỏ + Cuộn thư */}
              <div className="relative flex items-center justify-center">
                <div
                  onClick={() => {
                    setActiveFlowerId(branch._id);
                    if (canClickFlowerToNote && onClickMyBranch) {
                      onClickMyBranch(branch);
                    } else if (
                      hasNote &&
                      (isPublic || isAdmin) &&
                      onOpenScroll
                    ) {
                      onOpenScroll(branch);
                    }
                  }}
                  title={`[${fullName} đã tưới ${waterTimes} lần]`}
                  style={{
                    animationDelay: `${(slotIdx % 5) * 0.35}s`,
                  }}
                  className={`animate-flower-sway relative flex items-center justify-center ${
                    canClickFlowerToNote || (hasNote && (isPublic || isAdmin))
                      ? "cursor-pointer transition-transform hover:scale-110"
                      : "cursor-pointer"
                  }`}
                >
                  <RedFlowerSvg className="h-10 w-9 drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] sm:h-13 sm:w-11" />
                </div>

                {/* Dấu ! nhỏ nổi bật ngay gần bông hoa khi người dùng chưa để lại lời nhắn */}
                {canClickFlowerToNote && !hasNote && (
                  <motion.button
                    type="button"
                    animate={{ scale: [1, 1.22, 1], y: [0, -2, 0] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onClickMyBranch) onClickMyBranch(branch);
                    }}
                    title="Bấm để để lại lời nhắn cho Nam"
                    className="absolute -right-2 -top-1 z-30 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white bg-amber-500 text-[10px] font-black leading-none text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.95)] sm:h-5 sm:w-5 sm:text-xs"
                  >
                    !
                  </motion.button>
                )}

                {/* Cuộn thư nhỏ đặt ngay cạnh bông hoa nếu có lời nhắn */}
                {hasNote && (
                  <div className="absolute -right-4 bottom-1 z-30">
                    {isPublic ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenScroll) onOpenScroll(branch);
                        }}
                        title={`Đọc lời nhắn của ${fullName}`}
                        className="cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                      >
                        <img
                          src="/assets/scroll_public.png"
                          alt="Cuộn thư công khai"
                          draggable={false}
                          className="animate-scroll-swing h-6 w-auto object-contain drop-shadow-[0_3px_6px_rgba(239,68,68,0.65)] sm:h-7"
                        />
                      </button>
                    ) : isAdmin ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenScroll) onOpenScroll(branch);
                        }}
                        title={`[Nam] Mở thư bí mật của ${fullName}`}
                        className="cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                      >
                        <img
                          src="/assets/scroll_locked.png"
                          alt="Cuộn thư bí mật"
                          draggable={false}
                          className="animate-scroll-swing h-6 w-auto object-contain drop-shadow-[0_3px_6px_rgba(244,63,94,0.85)] sm:h-7"
                        />
                      </button>
                    ) : (
                      <div className="pointer-events-none flex items-center">
                        <img
                          src="/assets/scroll_locked.png"
                          alt="Cuộn thư bí mật"
                          draggable={false}
                          className="h-6 w-auto object-contain opacity-95 drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)] sm:h-7"
                        />
                        <Lock className="-ml-1 h-2.5 w-2.5 text-rose-300" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Nhãn tên dưới bông hoa: Bình thường hiện gọn, chạm/di chuột vào hiện đầy đủ [Tên đã tưới x lần] */}
              <div
                onClick={() => {
                  setActiveFlowerId((prev) =>
                    prev === branch._id ? null : branch._id
                  );
                  if (canClickFlowerToNote && onClickMyBranch) {
                    onClickMyBranch(branch);
                  }
                }}
                className="mt-0.5 cursor-pointer whitespace-nowrap rounded-full border border-amber-300/60 bg-slate-950/85 px-2 py-0.5 text-[9px] font-semibold text-amber-100 shadow-md transition-all sm:text-[11px]"
              >
                <span className={isExpanded ? "hidden" : "inline group-hover:hidden"}>
                  {shortName}
                </span>
                <span className={isExpanded ? "inline" : "hidden group-hover:inline"}>
                  [{fullName} đã tưới {waterTimes} lần]
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Nút lật trang bãi cỏ khi có > 6 bông hoa */}
      {totalPages > 1 && (
        <div className="pointer-events-none fixed bottom-2.5 left-1/2 z-30 -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/90 px-3 py-1 text-xs font-semibold text-amber-100 shadow-xl">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={safePage === 0}
              aria-label="Vườn hoa trước"
              className="rounded-full p-1 text-amber-300 transition hover:bg-slate-800 disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="whitespace-nowrap px-1.5 text-[11px] sm:text-xs">
              Khu vườn {safePage + 1}/{totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
              }
              disabled={safePage >= totalPages - 1}
              aria-label="Vườn hoa tiếp theo"
              className="rounded-full p-1 text-amber-300 transition hover:bg-slate-800 disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
