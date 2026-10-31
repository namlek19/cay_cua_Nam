"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Volume2,
  VolumeX,
  ShieldCheck,
  Home,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { getTreeStageInfo } from "@/lib/treeConfig";

export default function TopHudBar({
  totalCount = 0,
  ownerWaterCount = 0,
  guestWaterCount = 0,
  streak = 0,
  myTodayWaterCount = 0,
  branchCount = 0,
  isAdminPage = false,
  isMuted = false,
  onToggleMute,
  onOpenDrawer,
  dbConfigWarning = null,
}) {
  const stageInfo = getTreeStageInfo(totalCount);

  return (
    <header className="pointer-events-none relative z-30 flex w-full flex-col gap-2 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        {/* Left & Center HUD: Glassmorphism Status Card */}
        <div className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-white/25 bg-slate-950/65 p-3 text-white shadow-xl backdrop-blur-md sm:min-w-[360px] sm:p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-red-500 to-amber-500 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow">
                <Sparkles className="h-3.5 w-3.5" />
                Cấp {stageInfo.stage}/10
              </span>
              <div>
                <h1 className="text-sm font-extrabold leading-tight text-amber-200 sm:text-base">
                  {stageInfo.title}
                </h1>
                <p className="text-[11px] font-medium text-slate-300">
                  Tuổi cây: {stageInfo.age} • Tổng:{" "}
                  <b className="text-white">{totalCount} lần tưới</b>
                </p>
              </div>
            </div>

            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 rounded-xl border border-orange-400/40 bg-orange-500/20 px-2.5 py-1 text-xs font-bold text-orange-200 shadow-inner">
              <span>🔥 Streak: {streak} ngày</span>
            </div>
          </div>

          {/* Progress Bar to Next Stage */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-200">
              <span>
                Chủ vườn: <b>{ownerWaterCount}</b> • Bạn bè:{" "}
                <b>{guestWaterCount}</b>
              </span>
              {stageInfo.nextStageCount !== null ? (
                <span className="font-semibold text-amber-300">
                  Tiến độ: {totalCount}/{stageInfo.nextStageCount} (
                  {stageInfo.progressPercent}%)
                </span>
              ) : (
                <span className="font-semibold text-amber-300">
                  Đã đạt cấp Cổ Thụ Tối Đa (100%)
                </span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/15 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-500"
                style={{ width: `${stageInfo.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Bottom Pills: Today Water Count (on /) or Owner Status (on /admin) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
            {!isAdminPage ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/35 bg-sky-500/20 px-3 py-0.5 font-semibold text-sky-200">
                <span>💧 Hôm nay: {myTodayWaterCount}/10 lần</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/20 px-3 py-0.5 font-semibold text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                <span>Chế độ Chủ Vườn (Không giới hạn lượt tưới)</span>
              </div>
            )}

            <span className="text-[11px] text-amber-200/90">
              🌿 Đã mọc <b>{branchCount}</b> cành vàng
            </span>
          </div>
        </div>

        {/* Right HUD: Sound Toggle, Admin/Home Switch & "Sổ Cành Vàng" Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/25 bg-slate-950/65 text-amber-200 shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-slate-900/80"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-rose-300" />
            ) : (
              <Volume2 className="h-5 w-5 text-emerald-300" />
            )}
          </button>

          {isAdminPage ? (
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-white/25 bg-slate-950/65 px-3.5 text-xs font-bold text-slate-100 shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-slate-900/80"
            >
              <Home className="h-4 w-4 text-sky-300" />
              <span className="hidden sm:inline">Vườn Công Khai</span>
            </Link>
          ) : (
            <Link
              href="/admin"
              className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-white/25 bg-slate-950/65 px-3.5 text-xs font-bold text-slate-100 shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-slate-900/80"
            >
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              <span className="hidden sm:inline">Chủ Vườn</span>
            </Link>
          )}

          <button
            type="button"
            onClick={onOpenDrawer}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-500/90 to-orange-500/90 px-4 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 backdrop-blur-md transition hover:scale-105 hover:brightness-110 sm:text-sm"
          >
            <BookOpen className="h-4 w-4" />
            <span>Sổ Cành Vàng</span>
            <span className="rounded-full bg-slate-950/20 px-1.5 py-0.2 text-[11px] font-bold">
              {branchCount}
            </span>
          </button>
        </div>
      </div>

      {/* Friendly Database Setup Banner if MONGODB_URI still has <db_password> */}
      {dbConfigWarning && (
        <div className="pointer-events-auto max-w-xl rounded-2xl border border-amber-400/50 bg-amber-950/85 px-3.5 py-2 text-xs text-amber-100 shadow-lg backdrop-blur-md">
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

