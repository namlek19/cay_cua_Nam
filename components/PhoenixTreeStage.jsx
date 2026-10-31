"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock, Layers } from "lucide-react";
import { getTreeStageInfo } from "@/lib/treeConfig";

export default function PhoenixTreeStage({
  totalCount = 0,
  branches = [],
  isAdmin = false,
  isWatering = false,
  onOpenScroll,
}) {
  const stageInfo = useMemo(() => getTreeStageInfo(totalCount), [totalCount]);

  // Split branches into tiers of max 10 branches per tier
  const totalTiers = Math.max(1, Math.ceil(branches.length / 10));
  const [currentTier, setCurrentTier] = useState(totalTiers - 1);

  // Default & auto-jump to newest tier when new branches are added
  useEffect(() => {
    setCurrentTier(Math.max(0, Math.ceil(branches.length / 10) - 1));
  }, [branches.length]);

  const safeTier = Math.min(Math.max(0, currentTier), totalTiers - 1);
  const currentTierBranches = useMemo(() => {
    const start = safeTier * 10;
    return branches.slice(start, start + 10);
  }, [branches, safeTier]);

  const [minBottom, maxBottom] = stageInfo.branchY;
  const baseBranchWidthPercent = 30 * stageInfo.branchScale;

  return (
    <div
      className="TreeContainer z-10"
      style={{
        position: "absolute",
        bottom: "4%",
        left: "50%",
        transform: "translateX(-50%)",
        aspectRatio: "600 / 700",
        height: "min(74dvh, 88vw)",
      }}
    >
      {/* Scaled & Spring-animated Tree + Branches Wrapper */}
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
        {/* Golden Branches Layer (Rendered around the trunk) */}
        <div className="pointer-events-none absolute inset-0 z-20">
          {currentTierBranches.map((branch, idx) => {
            const isLeft = idx % 2 === 0;
            const bottomPct =
              minBottom + (idx / 9) * Math.max(1, maxBottom - minBottom);

            const displayName =
              branch.name && branch.name.trim() !== ""
                ? branch.name
                : "Người Ẩn Danh";
            const waterTimes = branch.waterCountOnBranch || 1;
            const hasNote = Boolean(
              branch.hasNote || (branch.note && branch.note.trim() !== "")
            );
            const isPublic = branch.isPublic !== false;

            return (
              <div
                key={branch._id || `${safeTier}_${idx}`}
                style={{
                  position: "absolute",
                  bottom: `${bottomPct.toFixed(2)}%`,
                  ...(isLeft ? { right: "50%" } : { left: "50%" }),
                  width: `${Math.max(14, baseBranchWidthPercent).toFixed(2)}%`,
                }}
                className={`pointer-events-auto flex flex-col ${
                  isLeft ? "items-end" : "items-start"
                }`}
              >
                {/* Badge info next to branch (Never flipped) */}
                <div
                  className={`mb-0.5 whitespace-nowrap rounded-full border border-amber-300/60 bg-slate-950/80 px-2 py-0.5 text-[9px] font-semibold text-amber-100 shadow-md backdrop-blur-xs sm:text-[11px] ${
                    isLeft ? "mr-2 text-right" : "ml-2 text-left"
                  }`}
                >
                  [{displayName} đã tưới {waterTimes} lần]
                </div>

                {/* Golden Branch Image Container */}
                <div className="relative w-full">
                  <img
                    src="/assets/golden_branch.png"
                    alt={`Cành vàng của ${displayName}`}
                    draggable={false}
                    style={{
                      transform: isLeft ? "scaleX(-1)" : "none",
                      filter: "drop-shadow(0 0 10px rgba(255, 215, 0, 0.85))",
                    }}
                    className="block h-auto w-full object-contain select-none"
                  />

                  {/* Scroll hanging below the golden branch */}
                  {hasNote && (
                    <div
                      style={{
                        position: "absolute",
                        top: "62%",
                        ...(isLeft ? { left: "26%" } : { right: "26%" }),
                      }}
                      className="z-30 flex flex-col items-center"
                    >
                      {isPublic ? (
                        <button
                          type="button"
                          onClick={() => onOpenScroll && onOpenScroll(branch)}
                          title={`Đọc lời nhắn của ${displayName}`}
                          className="group relative cursor-pointer focus:outline-none"
                        >
                          <img
                            src="/assets/scroll_public.png"
                            alt="Cuộn thư công khai"
                            draggable={false}
                            className="animate-scroll-swing h-8 w-auto object-contain drop-shadow-[0_4px_8px_rgba(239,68,68,0.6)] transition-transform group-hover:scale-125 sm:h-11"
                          />
                        </button>
                      ) : isAdmin ? (
                        <button
                          type="button"
                          onClick={() => onOpenScroll && onOpenScroll(branch)}
                          title={`[Chủ vườn] Mở thư bí mật của ${displayName}`}
                          className="group relative cursor-pointer focus:outline-none"
                        >
                          <img
                            src="/assets/scroll_locked.png"
                            alt="Cuộn thư bí mật (Mở khóa Chủ vườn)"
                            draggable={false}
                            className="animate-scroll-swing h-8 w-auto object-contain drop-shadow-[0_4px_10px_rgba(244,63,94,0.85)] transition-transform group-hover:scale-125 sm:h-11"
                          />
                          <span className="mt-0.5 rounded bg-rose-600/90 px-1 py-0.2 text-[8px] font-bold text-white shadow">
                            Mở đọc
                          </span>
                        </button>
                      ) : (
                        <div className=" flex flex-col items-center">
                          <img
                            src="/assets/scroll_locked.png"
                            alt="Cuộn thư bí mật"
                            draggable={false}
                            className="pointer-events-none h-8 w-auto object-contain opacity-95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] sm:h-11"
                          />
                          <span className="pointer-events-none mt-0.5 inline-flex items-center gap-0.5 whitespace-nowrap rounded-full border border-rose-300/40 bg-slate-950/85 px-1.5 py-0.2 text-[8px] font-medium text-rose-200 shadow">
                            <Lock className="h-2 w-2 text-rose-400" />
                            Bí mật
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Phoenix Tree Image (600x700 transparent PNG anchored at bottom center) */}
        <img
          src={stageInfo.img}
          alt={stageInfo.title}
          draggable={false}
          className="pointer-events-none relative z-10 h-full w-full object-contain object-bottom select-none drop-shadow-[0_12px_25px_rgba(0,0,0,0.45)]"
        />

        {/* Animated Watering Can Flying in & Pouring Water Droplets onto Roots */}
        <AnimatePresence>
          {isWatering && (
            <motion.div
              key="flying-watering-can"
              initial={{ opacity: 0, x: 90, y: 40, rotate: 10, scale: 0.7 }}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
                rotate: [-5, -34, -30, -34, -10],
                scale: 1,
              }}
              exit={{ opacity: 0, x: 70, y: 30, scale: 0.75 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              style={{
                position: "absolute",
                bottom: "14%",
                right: "10%",
              }}
              className="pointer-events-none z-40 flex flex-col items-center"
            >
              <img
                src="/assets/watering_can.png"
                alt="Đang tưới nước"
                className="h-24 w-24 object-contain drop-shadow-[0_10px_20px_rgba(14,165,233,0.55)] sm:h-32 sm:w-32"
              />

              {/* Falling Water Streams from Spout to Tree Roots */}
              <div className="absolute -bottom-10 -left-10 flex gap-2">
                {[0, 1, 2, 3, 4].map((dropIdx) => (
                  <motion.span
                    key={dropIdx}
                    initial={{ opacity: 0, y: -10, x: 0, scale: 0.6 }}
                    animate={{
                      opacity: [0, 1, 0.9, 0],
                      y: [0, 48, 82],
                      x: [-dropIdx * 5, -18 - dropIdx * 8],
                      scale: [0.7, 1.1, 0.5],
                    }}
                    transition={{
                      duration: 0.65,
                      repeat: 2,
                      delay: dropIdx * 0.11,
                      ease: "easeIn",
                    }}
                    className="block h-3.5 w-2 rounded-full bg-gradient-to-b from-cyan-200 via-sky-400 to-blue-500 shadow-[0_0_10px_rgba(56,189,248,0.9)]"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tier Switcher near the base of the tree when branches.length > 10 */}
      {totalTiers > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "1.5%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
          className="z-30 flex items-center gap-1.5 rounded-full border border-amber-300/45 bg-slate-950/85 px-3 py-1 text-xs font-semibold text-amber-100 shadow-xl backdrop-blur-md"
        >
          <button
            type="button"
            onClick={() => setCurrentTier((prev) => Math.max(0, prev - 1))}
            disabled={safeTier === 0}
            aria-label="Tầng cành trước"
            className="rounded-full p-1 text-amber-300 transition hover:bg-white/15 disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="inline-flex items-center gap-1 whitespace-nowrap px-1 text-[11px] sm:text-xs">
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            Tầng cành {safeTier + 1}/{totalTiers}
          </span>

          <button
            type="button"
            onClick={() =>
              setCurrentTier((prev) => Math.min(totalTiers - 1, prev + 1))
            }
            disabled={safeTier >= totalTiers - 1}
            aria-label="Tầng cành tiếp theo"
            className="rounded-full p-1 text-amber-300 transition hover:bg-white/15 disabled:opacity-35"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

