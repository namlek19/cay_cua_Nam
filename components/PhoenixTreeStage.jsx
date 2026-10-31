"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import { getTreeStageInfo } from "@/lib/treeConfig";

function RedFlowerSvg({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Thân cây hoa màu xanh */}
      <path
        d="M32 34C32 48 31 62 32 74"
        stroke="#15803d"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Lá bên trái */}
      <path
        d="M31 56C22 54 16 47 18 42C23 42 29 48 31 56Z"
        fill="#22c55e"
        stroke="#15803d"
        strokeWidth="1.5"
      />
      {/* Lá bên phải */}
      <path
        d="M33 52C42 50 48 43 46 38C41 38 35 44 33 52Z"
        fill="#22c55e"
        stroke="#15803d"
        strokeWidth="1.5"
      />
      {/* 5 cánh hoa màu đỏ rực rỡ */}
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
      {/* Nhụy hoa màu vàng tươi */}
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

          {/* Giọt nước chảy ra từ vòi bình tưới khi đang tưới */}
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

      {/* 2. Những bông hoa màu đỏ mọc ngẫu nhiên trên sân cỏ (Hiển thị đồng nhất trên cả Mobile & PC) */}
      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        {branches.map((branch, idx) => {
          const posX = typeof branch.posX === "number" ? branch.posX : 24;
          const posY = typeof branch.posY === "number" ? branch.posY : 15;

          const displayName =
            branch.name && branch.name.trim() !== ""
              ? branch.name
              : "Người ẩn danh";
          const waterTimes = branch.waterCountOnBranch || 1;
          const hasNote = Boolean(
            branch.hasNote || (branch.note && branch.note.trim() !== "")
          );
          const isPublic = branch.isPublic !== false;
          const canClickFlowerToNote = !isAdmin && Boolean(branch.isMineToday);

          return (
            <div
              key={branch._id || idx}
              style={{
                position: "absolute",
                left: `${posX}%`,
                bottom: `${posY}%`,
                transform: "translateX(-50%)",
              }}
              className="pointer-events-auto flex flex-col items-center"
            >
              {/* Khu vực Bông hoa đung đưa trong gió + Dấu ! nhỏ + Cuộn thư */}
              <div className="relative flex items-center justify-center">
                {/* Bông hoa đỏ đung đưa trong gió */}
                <div
                  onClick={() => {
                    if (canClickFlowerToNote && onClickMyBranch) {
                      onClickMyBranch(branch);
                    } else if (hasNote && (isPublic || isAdmin) && onOpenScroll) {
                      onOpenScroll(branch);
                    }
                  }}
                  title={
                    canClickFlowerToNote
                      ? hasNote
                        ? "Bấm để sửa hoặc xóa lời nhắn của bạn"
                        : "Bấm vào bông hoa để viết lời nhắn cho Nam"
                      : hasNote && (isPublic || isAdmin)
                        ? `Đọc lời nhắn của ${displayName}`
                        : undefined
                  }
                  style={{
                    animationDelay: `${(idx % 5) * 0.35}s`,
                  }}
                  className={`animate-flower-sway relative flex items-center justify-center ${
                    canClickFlowerToNote || (hasNote && (isPublic || isAdmin))
                      ? "cursor-pointer transition-transform hover:scale-110"
                      : ""
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
                        title={`Đọc lời nhắn của ${displayName}`}
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
                        title={`[Nam] Mở thư bí mật của ${displayName}`}
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

              {/* Nhãn tên ngay gần bông hoa: [abc/Người ẩn danh đã tưới x lần] */}
              <div
                onClick={() => {
                  if (canClickFlowerToNote && onClickMyBranch) {
                    onClickMyBranch(branch);
                  }
                }}
                className={`mt-0.5 whitespace-nowrap rounded-full border border-amber-300/60 bg-slate-950/85 px-2 py-0.5 text-[9px] font-semibold text-amber-100 shadow-md sm:text-[11px] ${
                  canClickFlowerToNote ? "cursor-pointer hover:bg-slate-900" : ""
                }`}
              >
                [{displayName} đã tưới {waterTimes} lần]
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
