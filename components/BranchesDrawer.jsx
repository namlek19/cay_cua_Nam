"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  Lock,
  Globe,
  Droplets,
  Sparkles,
  ScrollText,
  Filter,
} from "lucide-react";

export default function BranchesDrawer({
  isOpen,
  onClose,
  branches = [],
  isAdmin = false,
  onOpenScroll,
}) {
  const [filterMode, setFilterMode] = useState("all"); // "all" | "public" | "secret" | "hasNote"

  const filteredBranches = useMemo(() => {
    return branches.filter((b, index) => {
      b._orderIndex = index + 1; // 1 = Gốc cây (cũ nhất), N = Ngọn cây (mới nhất)
      const hasNote = Boolean(b.hasNote || (b.note && b.note.trim() !== ""));
      if (filterMode === "public") return b.isPublic !== false && hasNote;
      if (filterMode === "secret") return b.isPublic === false && hasNote;
      if (filterMode === "hasNote") return hasNote;
      return true;
    });
  }, [branches, filterMode]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-xs"
          />

          <motion.aside
            key="drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-md flex-col border-l border-amber-300/30 bg-slate-950/90 text-white shadow-2xl backdrop-blur-xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-inner">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-amber-200 sm:text-lg">
                    Sổ Cành Vàng Kỷ Niệm
                  </h2>
                  <p className="text-xs text-slate-300">
                    Từ gốc lên ngọn ({branches.length} cành vàng)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng sổ cành vàng"
                className="rounded-full border border-white/15 bg-white/10 p-2 text-slate-200 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter Bar (Enhanced for /admin with Public / Secret filter, and useful on / too) */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 bg-white/5 px-4 py-2.5 text-xs">
              <span className="mr-1 inline-flex items-center gap-1 font-medium text-slate-300">
                <Filter className="h-3.5 w-3.5 text-amber-400" />
                Bộ lọc:
              </span>

              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  filterMode === "all"
                    ? "bg-amber-400 text-slate-950 shadow"
                    : "bg-white/10 text-slate-200 hover:bg-white/20"
                }`}
              >
                Tất cả ({branches.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("public")}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium transition ${
                  filterMode === "public"
                    ? "bg-emerald-400 text-slate-950 shadow"
                    : "bg-white/10 text-slate-200 hover:bg-white/20"
                }`}
              >
                <Globe className="h-3 w-3" />
                Công khai
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("secret")}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium transition ${
                  filterMode === "secret"
                    ? "bg-rose-400 text-slate-950 shadow"
                    : "bg-white/10 text-slate-200 hover:bg-white/20"
                }`}
              >
                <Lock className="h-3 w-3" />
                Bí mật
              </button>
            </div>

            {/* Branch List from Root (oldest) to Crown (newest) */}
            <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
              {filteredBranches.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-slate-300">
                  <Sparkles className="mb-2 h-8 w-8 text-amber-300/70" />
                  <p className="text-sm font-medium">
                    Chưa có cành vàng nào trong danh mục này.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Hãy bấm vào bình tưới nước để mọc cành vàng đầu tiên nhé!
                  </p>
                </div>
              ) : (
                filteredBranches.map((branch) => {
                  const displayName =
                    branch.name && branch.name.trim() !== ""
                      ? branch.name
                      : "Người Ẩn Danh";
                  const count = branch.waterCountOnBranch || 1;
                  const hasNote = Boolean(
                    branch.hasNote || (branch.note && branch.note.trim() !== "")
                  );
                  const isSecret = branch.isPublic === false;
                  const canReadNote = hasNote && (isAdmin || !isSecret);

                  return (
                    <div
                      key={branch._id}
                      className={`group relative rounded-2xl border p-3.5 transition ${
                        isSecret
                          ? "border-rose-400/30 bg-gradient-to-br from-rose-950/35 to-slate-900/80"
                          : "border-amber-400/25 bg-gradient-to-br from-amber-950/30 to-slate-900/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">
                            #{branch._orderIndex}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-bold text-amber-100">
                                {displayName}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
                                <Droplets className="h-3 w-3" />
                                đã tưới {count} lần
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Ngày: {branch.dateStr}
                            </span>
                          </div>
                        </div>

                        {hasNote && (
                          <div>
                            {isSecret ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-medium text-rose-200">
                                <Lock className="h-3 w-3" />
                                Bí mật
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">
                                <Globe className="h-3 w-3" />
                                Công khai
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Note Content or Secret Label */}
                      {hasNote ? (
                        <div className="mt-2.5">
                          {canReadNote ? (
                            <div className="rounded-xl border border-amber-200/15 bg-black/35 p-3">
                              <p className="line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-amber-100/95">
                                “{branch.note}”
                              </p>
                              <button
                                type="button"
                                onClick={() => onOpenScroll(branch)}
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 underline-offset-2 hover:text-amber-200 hover:underline"
                              >
                                <ScrollText className="h-3.5 w-3.5" />
                                Mở cuộn thư đọc toàn văn
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-950/35 px-3 py-2 text-xs font-medium text-rose-200/90">
                              <Lock className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                              <span>
                                🔒 Lời nhắn bí mật dành riêng cho chủ vườn
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs italic text-slate-400">
                          Đã tưới nước tiếp thêm sức sống cho cây (không kèm lời
                          nhắn).
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

