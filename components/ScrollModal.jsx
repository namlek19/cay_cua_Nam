"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Lock, Globe, Calendar, Droplets } from "lucide-react";

export default function ScrollModal({ branch, onClose }) {
  if (!branch) return null;

  const displayName =
    branch.name && branch.name.trim() !== "" ? branch.name : "Người Ẩn Danh";
  const waterCount = branch.waterCountOnBranch || 1;
  const isSecret = branch.isPublic === false;

  return (
    <AnimatePresence>
      <motion.div
        key="scroll-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      >
        <motion.div
          initial={{ scale: 0.78, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.82, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl select-text"
        >
          {/* Close button floating top-right */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cuộn thư"
            className="absolute -right-2 -top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-200/80 bg-amber-900/90 text-amber-100 shadow-lg transition hover:scale-105 hover:bg-amber-800"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Parchment Container using /assets/scroll_open_bg.png */}
          <div
            className="relative mx-auto flex min-h-[300px] w-full flex-col justify-between bg-contain bg-center bg-no-repeat px-[14%] py-[12%] sm:min-h-[370px] sm:px-[15%] sm:py-[11%]"
            style={{
              backgroundImage: "url('/assets/scroll_open_bg.png')",
              backgroundSize: "100% 100%",
            }}
          >
            {/* Header Info */}
            <div className="border-b border-amber-900/25 pb-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-amber-950">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-700" />
                  <h3 className="text-base font-bold tracking-tight sm:text-lg">
                    {displayName}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-900/15 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                    <Droplets className="h-3 w-3 text-sky-700" />
                    đã tưới {waterCount} lần
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-amber-900/80">
                  {isSecret ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-900/15 px-2.5 py-0.5 font-semibold text-rose-900">
                      <Lock className="h-3 w-3" />
                      Thư bí mật
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/15 px-2.5 py-0.5 font-semibold text-emerald-900">
                      <Globe className="h-3 w-3" />
                      Công khai
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Body Message */}
            <div className="custom-scrollbar my-3 max-h-[170px] overflow-y-auto pr-1 sm:my-4 sm:max-h-[210px]">
              <p className="whitespace-pre-wrap break-words font-serif text-sm leading-relaxed text-amber-950 sm:text-base">
                “{branch.note}”
              </p>
            </div>

            {/* Footer Date & Action */}
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-xs text-amber-900/80">
              <span className="inline-flex items-center gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5" />
                Ngày gửi: {branch.dateStr || "Hôm nay"}
              </span>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-amber-900/85 px-4 py-1 text-xs font-semibold text-amber-50 shadow transition hover:bg-amber-800"
              >
                Đóng cuộn thư
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

