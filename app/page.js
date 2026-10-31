"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Droplets, Feather, Sparkles } from "lucide-react";
import EnvironmentCanvas from "@/components/EnvironmentCanvas";
import TopHudBar from "@/components/TopHudBar";
import PhoenixTreeStage from "@/components/PhoenixTreeStage";
import GuestWaterModal from "@/components/GuestWaterModal";
import BranchesDrawer from "@/components/BranchesDrawer";
import ScrollModal from "@/components/ScrollModal";
import { getTreeStageInfo } from "@/lib/treeConfig";
import { playWaterAndChimeSound, playScrollSound } from "@/lib/soundEffects";

function getLocalTodayVN() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
}

export default function HomePage() {
  const [treeState, setTreeState] = useState({
    ownerWaterCount: 0,
    guestWaterCount: 0,
    totalCount: 0,
    streak: 0,
    lastOwnerWaterDate: null,
  });
  const [branches, setBranches] = useState([]);
  const [myTodayWaterCount, setMyTodayWaterCount] = useState(0);
  const [dbConfigWarning, setDbConfigWarning] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isWatering, setIsWatering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeScrollBranch, setActiveScrollBranch] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3800);
  }, []);

  // Sync myTodayWaterCount between server and localStorage for todayVN
  const syncTodayWaterCount = useCallback((serverCount, todayStr) => {
    if (typeof window === "undefined") {
      setMyTodayWaterCount(serverCount);
      return;
    }
    const dateKey = todayStr || getLocalTodayVN();
    const storedRaw = localStorage.getItem("cay_phuong_today_water");
    let localCount = 0;

    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw);
        if (parsed.dateStr === dateKey) {
          localCount = Number(parsed.count) || 0;
        }
      } catch {
        localCount = 0;
      }
    }

    const synced = Math.min(10, Math.max(Number(serverCount) || 0, localCount));
    setMyTodayWaterCount(synced);
    localStorage.setItem(
      "cay_phuong_today_water",
      JSON.stringify({ dateStr: dateKey, count: synced })
    );
  }, []);

  const fetchTreeData = useCallback(async () => {
    try {
      const res = await fetch("/api/tree", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setTreeState(data.treeState);
        setBranches(data.branches || []);
        setDbConfigWarning(data.dbConfigWarning || null);
        syncTodayWaterCount(data.myTodayWaterCount || 0, data.todayVN);
      }
    } catch {
      showToast("Không thể kết nối máy chủ, vui lòng thử lại.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast, syncTodayWaterCount]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("cay_phuong_muted");
      if (savedMute === "true") setIsMuted(true);
    }
    fetchTreeData();
  }, [fetchTreeData]);

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("cay_phuong_muted", String(next));
      }
      return next;
    });
  };

  const triggerWaterCelebration = (prevTotal, nextTotal, hasNote) => {
    setIsWatering(true);
    playWaterAndChimeSound(isMuted);

    const prevStage = getTreeStageInfo(prevTotal).stage;
    const nextStage = getTreeStageInfo(nextTotal).stage;

    if (nextStage > prevStage || hasNote) {
      confetti({
        particleCount: nextStage > prevStage ? 90 : 45,
        spread: 70,
        origin: { y: 0.65 },
        colors: ["#fbbf24", "#ef4444", "#38bdf8", "#4ade80"],
      });
    }

    setTimeout(() => {
      setIsWatering(false);
    }, 1700);
  };

  const handleSubmitWater = async ({ name, isAnonymous, note, isPublic }) => {
    if (myTodayWaterCount >= 10) {
      showToast(
        "Hôm nay bạn đã tưới đủ 10/10 lần rồi, mai quay lại tưới tiếp nhé!",
        "warning"
      );
      return false;
    }

    setIsSubmitting(true);
    const prevTotal =
      (treeState.ownerWaterCount || 0) + (treeState.guestWaterCount || 0);

    try {
      const res = await fetch("/api/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isAnonymous, note, isPublic }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (res.status === 429) {
          syncTodayWaterCount(10, getLocalTodayVN());
        }
        showToast(
          data.error ||
            "Hôm nay bạn đã tưới đủ 10/10 lần rồi, mai quay lại tưới tiếp nhé!",
          "warning"
        );
        return false;
      }

      setTreeState(data.treeState);
      setBranches(data.branches || []);
      if (data.dbConfigWarning) setDbConfigWarning(data.dbConfigWarning);

      syncTodayWaterCount(data.myTodayWaterCount, data.todayVN);
      triggerWaterCelebration(
        prevTotal,
        data.treeState.totalCount,
        Boolean(note && note.trim() !== "")
      );

      showToast(
        note && note.trim() !== ""
          ? "Đã tưới nước & treo cuộn thư lên Cành Vàng thành công!"
          : "Cảm ơn bạn! Cây Phượng Đỏ vừa nhận thêm 1 lượt tưới mát lành.",
        "success"
      );
      return true;
    } catch {
      showToast("Có lỗi kết nối khi tưới cây, vui lòng thử lại!", "error");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickWater = async () => {
    if (isSubmitting || isWatering) return;
    if (myTodayWaterCount >= 10) {
      showToast(
        "Hôm nay bạn đã tưới đủ 10/10 lần rồi, mai quay lại tưới tiếp nhé!",
        "warning"
      );
      return;
    }

    let savedName = "";
    let savedAnon = false;
    if (typeof window !== "undefined") {
      savedName = localStorage.getItem("cay_phuong_guest_name") || "";
      savedAnon = localStorage.getItem("cay_phuong_guest_anon") === "true";
    }

    await handleSubmitWater({
      name: savedAnon ? null : savedName,
      isAnonymous: savedAnon,
      note: "",
      isPublic: true,
    });
  };

  const handleOpenScroll = (branch) => {
    if (!branch) return;
    if (branch.isPublic === false) return; // Bảo mật tuyệt đối ở trang /
    playScrollSound(isMuted);
    setActiveScrollBranch(branch);
  };

  const totalCount =
    (treeState.ownerWaterCount || 0) + (treeState.guestWaterCount || 0);

  return (
    <main className="garden-bg relative h-[100dvh] w-screen overflow-hidden select-none">
      {/* Ambient Sparkles, Falling Petals (Stage 6+) & Water Splash Layer */}
      <EnvironmentCanvas totalCount={totalCount} isWatering={isWatering} />

      {/* Top Glassmorphism HUD Bar */}
      <TopHudBar
        totalCount={totalCount}
        ownerWaterCount={treeState.ownerWaterCount || 0}
        guestWaterCount={treeState.guestWaterCount || 0}
        streak={treeState.streak || 0}
        myTodayWaterCount={myTodayWaterCount}
        branchCount={branches.length}
        isAdminPage={false}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        dbConfigWarning={dbConfigWarning}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast-banner"
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed left-1/2 top-24 z-50 flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold shadow-2xl backdrop-blur-md sm:text-sm ${
              toast.type === "warning" || toast.type === "error"
                ? "border-rose-400/50 bg-rose-950/90 text-rose-100"
                : "border-emerald-400/50 bg-emerald-950/90 text-emerald-100"
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0 text-amber-300" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centerpiece: 10-Stage Phoenix Tree & Golden Branches */}
      <PhoenixTreeStage
        totalCount={totalCount}
        branches={branches}
        isAdmin={false}
        isWatering={isWatering}
        onOpenScroll={handleOpenScroll}
      />

      {/* Bottom Interactive Dock: Watering Can & Message Action */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 sm:bottom-5">
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/25 bg-slate-950/75 p-2 pr-4 text-white shadow-2xl backdrop-blur-xl">
          {/* Main Watering Can Button (Quick 1-Tap Water) */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.07, rotate: -6 }}
            whileTap={{ scale: 0.93 }}
            disabled={isSubmitting || isLoading}
            onClick={handleQuickWater}
            title="Bấm để tưới nước ngay"
            className="group relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-sky-300/70 bg-gradient-to-br from-sky-400/40 via-cyan-500/30 to-blue-600/40 shadow-lg shadow-sky-500/30 transition sm:h-16 sm:w-16"
          >
            <img
              src="/assets/watering_can.png"
              alt="Bình tưới nước"
              draggable={false}
              className="h-11 w-11 object-contain drop-shadow-md transition-transform group-hover:-rotate-12 sm:h-13 sm:w-13"
            />
            <span className="absolute -bottom-1 rounded-full bg-sky-500 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-tight text-slate-950 shadow">
              {myTodayWaterCount}/10
            </span>
          </motion.button>

          {/* Two Action Triggers: Quick Water & Water + Write Scroll */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <button
              type="button"
              disabled={isSubmitting || isLoading}
              onClick={handleQuickWater}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-3.5 py-2 text-xs font-extrabold text-slate-950 shadow-md transition hover:brightness-110 disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <Droplets className="h-4 w-4 text-blue-900" />
              <span>Tưới Nước Ngay</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || isLoading}
              onClick={() => setIsWaterModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-300/60 bg-gradient-to-r from-amber-500/90 to-orange-500/90 px-3.5 py-2 text-xs font-extrabold text-slate-950 shadow-md transition hover:brightness-110 disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <Feather className="h-4 w-4 text-amber-950" />
              <span>Tưới & Viết Cuộn Thư</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Guest Water + Note Customization */}
      <GuestWaterModal
        isOpen={isWaterModalOpen}
        onClose={() => setIsWaterModalOpen(false)}
        onSubmitWater={handleSubmitWater}
        isSubmitting={isSubmitting}
        myTodayWaterCount={myTodayWaterCount}
      />

      {/* Drawer: Sổ Cành Vàng */}
      <BranchesDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        branches={branches}
        isAdmin={false}
        onOpenScroll={(branch) => {
          setIsDrawerOpen(false);
          handleOpenScroll(branch);
        }}
      />

      {/* Modal: Read Scroll Note on /assets/scroll_open_bg.png */}
      <ScrollModal
        branch={activeScrollBranch}
        onClose={() => setActiveScrollBranch(null)}
      />
    </main>
  );
}

