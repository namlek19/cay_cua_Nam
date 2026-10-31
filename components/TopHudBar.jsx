"use client";

import React from "react";
import Link from "next/link";
import { Home, AlertTriangle } from "lucide-react";
import { getTreeStageInfo } from "@/lib/treeConfig";

export default function TopHudBar({
  totalCount = 0,
  ownerWaterCount = 0,
  guestWaterCount = 0,
  streak = 0,
  isAdminPage = false,
  dbConfigWarning = null,
}) {
  const stageInfo = getTreeStageInfo(totalCount);

  return (
    <header className="pointer-events-none relative z-30 flex w-full flex-col gap-2 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        {/* Left HUD Card: Chỉ hiện Level cây, Streak của Nam, và Nam / Mọi người */}
        <div className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-white/20 bg-slate-900/85 px-4 py-3 text-white shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-slate-950">
              Level {stageInfo.stage}/10
            </span>

            <div className="flex items-center gap-1.5 rounded-lg border border-orange-400/40 bg-orange-500/15 px-2.5 py-1 text-xs font-bold text-orange-200">
              <span>🔥 Streak của Nam: {streak} ngày</span>
            </div>
          </div>

          <div className="text-xs font-medium text-slate-200 sm:text-sm">
            Nam: <b className="text-white">{ownerWaterCount}</b> • Mọi người:{" "}
            <b className="text-white">{guestWaterCount}</b>
          </div>
        </div>

        {/* Right HUD: Chỉ ở /admin mới có nút chuyển sang trang thường */}
        {isAdminPage && (
          <div className="pointer-events-auto flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-white/20 bg-slate-900/85 px-3.5 text-xs font-bold text-slate-100 shadow-lg backdrop-blur-md transition hover:bg-slate-800"
            >
              <Home className="h-4 w-4 text-sky-300" />
              <span>Trang thường</span>
            </Link>
          </div>
        )}
      </div>

      {/* Friendly Database Setup Banner if MONGODB_URI still has <db_password> */}
      {dbConfigWarning && (
        <div className="pointer-events-auto max-w-xl rounded-2xl border border-amber-400/50 bg-amber-950/90 px-3.5 py-2 text-xs text-amber-100 shadow-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="font-bold text-amber-200">
                {dbConfigWarning.message}
              </p>
              <p className="mt-0.5 text-[11px] text-amber-100/90">
                {dbConfigWarning.guide}
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
