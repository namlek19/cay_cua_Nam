"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Lock,
  KeyRound,
  Droplets,
  Flame,
  Sparkles,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Delete,
} from "lucide-react";
import EnvironmentCanvas from "@/components/EnvironmentCanvas";
import TopHudBar from "@/components/TopHudBar";
import PhoenixTreeStage from "@/components/PhoenixTreeStage";
import BranchesDrawer from "@/components/BranchesDrawer";
import ScrollModal from "@/components/ScrollModal";
import { getTreeStageInfo } from "@/lib/treeConfig";
import { playWaterAndChimeSound, playScrollSound } from "@/lib/soundEffects";

export default function AdminPage() {
  const [pinInput, setPinInput] = useState("");
  const [verifiedPin, setVerifiedPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [treeState, setTreeState] = useState({
    ownerWaterCount: 0,
    guestWaterCount: 0,
    totalCount: 0,
    streak: 0,
    lastOwnerWaterDate: null,
  });
  const [branches, setBranches] = useState([]);
  const [dbConfigWarning, setDbConfigWarning] = useState(null);

  const [isWatering, setIsWatering] = useState(false);
  const [isSubmittingWater, setIsSubmittingWater] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeScrollBranch, setActiveScrollBranch] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3600);
  }, []);

  const verifyAdminPin = useCallback(
    async (candidatePin, silent = false) => {
      if (!candidatePin || candidatePin.length !== 6) {
        if (!silent) setPinError("Vui lòng nhập đủ mã PIN 6 chữ số.");
        return false;
      }

      setIsVerifying(true);
      setPinError("");

      try {
        const res = await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", pin: candidatePin }),
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          if (!silent) {
            setPinError(
              data.error || "Mã PIN 6 số không chính xác! Vui lòng thử lại."
            );
          }
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("cay_phuong_admin_pin");
          }
          return false;
        }

        // Also fetch via GET /api/tree with x-admin-pin header to ensure full sync
        const treeRes = await fetch("/api/tree", {
          headers: { "x-admin-pin": candidatePin },
          cache: "no-store",
        });
        const treeData = await treeRes.json();

        if (treeData.ok) {
          setTreeState(treeData.treeState);
          setBranches(treeData.branches || []);
          setDbConfigWarning(treeData.dbConfigWarning || null);
        } else {
          setTreeState(data.treeState);
          setBranches(data.branches || []);
          setDbConfigWarning(data.dbConfigWarning || null);
        }

        setVerifiedPin(candidatePin);
        setIsUnlocked(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("cay_phuong_admin_pin", candidatePin);
        }
        if (!silent) {
          showToast("Chào mừng Chủ Vườn quay trở lại!", "success");
        }
        return true;
      } catch {
        if (!silent) {
          setPinError("Không thể kết nối tới máy chủ để xác thực PIN.");
        }
        return false;
      } finally {
        setIsVerifying(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("cay_phuong_muted");
      if (savedMute === "true") setIsMuted(true);

      const savedSessionPin = sessionStorage.getItem("cay_phuong_admin_pin");
      if (savedSessionPin && savedSessionPin.length === 6) {
        setPinInput(savedSessionPin);
        verifyAdminPin(savedSessionPin, true);
      }
    }
  }, [verifyAdminPin]);

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("cay_phuong_muted", String(next));
      }
      return next;
    });
  };

  const handleDigitPress = (digit) => {
    if (pinInput.length >= 6) return;
    const nextPin = `${pinInput}${digit}`;
    setPinInput(nextPin);
    setPinError("");
    if (nextPin.length === 6) {
      verifyAdminPin(nextPin, false);
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError("");
  };

  const handlePinFormSubmit = (e) => {
    e.preventDefault();
    verifyAdminPin(pinInput, false);
  };

  const handleOwnerWater = async () => {
    if (isSubmittingWater || isWatering || !verifiedPin) return;
    setIsSubmittingWater(true);

    const prevTotal =
      (treeState.ownerWaterCount || 0) + (treeState.guestWaterCount || 0);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "water", pin: verifiedPin }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        showToast(data.error || "Không thể tưới nước lúc này.", "error");
        return;
      }

      setTreeState(data.treeState);
      setBranches(data.branches || []);
      if (data.dbConfigWarning) setDbConfigWarning(data.dbConfigWarning);

      setIsWatering(true);
      playWaterAndChimeSound(isMuted);

      const prevStage = getTreeStageInfo(prevTotal).stage;
      const nextStage = getTreeStageInfo(data.treeState.totalCount).stage;

      if (nextStage > prevStage) {
        confetti({
          particleCount: 100,
          spread: 75,
          origin: { y: 0.65 },
          colors: ["#fbbf24", "#ef4444", "#38bdf8", "#4ade80"],
        });
      }

      setTimeout(() => {
        setIsWatering(false);
      }, 1700);

      showToast(
        `Chủ vườn đã tưới cây! 🔥 Streak hiện tại: ${data.treeState.streak} ngày.`,
        "success"
      );
    } catch {
      showToast("Lỗi kết nối khi tưới cây!", "error");
    } finally {
      setIsSubmittingWater(false);
    }
  };

  const handleOpenScroll = (branch) => {
    if (!branch) return;
    playScrollSound(isMuted);
    setActiveScrollBranch(branch);
  };

  const handleLockGarden = () => {
    setIsUnlocked(false);
    setVerifiedPin("");
    setPinInput("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("cay_phuong_admin_pin");
    }
  };

  const totalCount =
    (treeState.ownerWaterCount || 0) + (treeState.guestWaterCount || 0);
  const secretNotesCount = branches.filter(
    (b) => b.isPublic === false && (b.hasNote || (b.note && b.note.trim() !== ""))
  ).length;

  return (
    <main className="garden-bg relative h-[100dvh] w-screen overflow-hidden select-none">
      {/* Ambient Sparkles, Falling Petals & Water Splash */}
      <EnvironmentCanvas totalCount={totalCount} isWatering={isWatering} />

      {/* PIN Lock Screen Overlay when not unlocked */}
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div
            key="admin-pin-lock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-amber-300/35 bg-slate-900/95 p-6 text-white shadow-2xl"
            >
              <div className="mb-5 flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/50 bg-gradient-to-br from-amber-500/30 to-rose-500/30 text-amber-300 shadow-lg">
                  <KeyRound className="h-7 w-7" />
                </div>
                <h1 className="text-lg font-extrabold text-amber-200 sm:text-xl">
                  Cổng Khu Vườn Chủ Nhân
                </h1>
                <p className="mt-1 text-xs text-slate-300">
                  Nhập mã PIN 6 số để chăm sóc Cây Phượng Đỏ, giữ chuỗi Streak &
                  mở khóa các Cuộn Thư Bí Mật.
                </p>
              </div>

              <form onSubmit={handlePinFormSubmit} className="space-y-4">
                {/* 6-digit PIN Indicator Boxes */}
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                    const filled = idx < pinInput.length;
                    return (
                      <div
                        key={idx}
                        className={`flex h-11 w-10 items-center justify-center rounded-xl border text-lg font-bold transition ${
                          filled
                            ? "border-amber-400 bg-amber-400/20 text-amber-200 shadow-sm"
                            : "border-white/20 bg-white/5 text-slate-500"
                        }`}
                      >
                        {filled ? "•" : ""}
                      </div>
                    );
                  })}
                </div>

                {/* Keyboard Input Support */}
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPinInput(clean);
                    setPinError("");
                    if (clean.length === 6) {
                      verifyAdminPin(clean, false);
                    }
                  }}
                  placeholder="Hoặc gõ trực tiếp 6 số PIN..."
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-center text-xs text-amber-100 placeholder-slate-400 outline-none focus:border-amber-400"
                />

                {pinError && (
                  <p className="rounded-xl border border-rose-400/40 bg-rose-500/20 px-3 py-2 text-center text-xs font-semibold text-rose-200">
                    {pinError}
                  </p>
                )}

                {/* Touch Numpad */}
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleDigitPress(num)}
                      className="h-11 rounded-xl border border-white/15 bg-white/10 text-base font-bold text-white transition hover:bg-amber-400/25 active:scale-95"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setPinInput("");
                      setPinError("");
                    }}
                    className="h-11 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-slate-300 transition hover:bg-white/15"
                  >
                    Xóa hết
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigitPress(0)}
                    className="h-11 rounded-xl border border-white/15 bg-white/10 text-base font-bold text-white transition hover:bg-amber-400/25 active:scale-95"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    aria-label="Xóa 1 số"
                    className="flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/15"
                  >
                    <Delete className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || pinInput.length !== 6}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition hover:brightness-110 disabled:opacity-50"
                >
                  {isVerifying ? "Đang kiểm tra PIN..." : "Mở Khóa Khu Vườn"}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-center border-t border-white/10 pt-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 transition hover:text-amber-300"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Quay về trang Vườn Công Khai (/)
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unlocked Admin Interface */}
      {isUnlocked && (
        <>
          <TopHudBar
            totalCount={totalCount}
            ownerWaterCount={treeState.ownerWaterCount || 0}
            guestWaterCount={treeState.guestWaterCount || 0}
            streak={treeState.streak || 0}
            myTodayWaterCount={0}
            branchCount={branches.length}
            isAdminPage={true}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            dbConfigWarning={dbConfigWarning}
          />

          {/* Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                key="admin-toast"
                initial={{ opacity: 0, y: -20, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: -20, x: "-50%" }}
                className={`fixed left-1/2 top-24 z-50 flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold shadow-2xl backdrop-blur-md sm:text-sm ${
                  toast.type === "error"
                    ? "border-rose-400/50 bg-rose-950/90 text-rose-100"
                    : "border-emerald-400/50 bg-emerald-950/90 text-emerald-100"
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-amber-300" />
                <span>{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 10-Stage Phoenix Tree with Admin Access (Unlocks Secret Scrolls!) */}
          <PhoenixTreeStage
            totalCount={totalCount}
            branches={branches}
            isAdmin={true}
            isWatering={isWatering}
            onOpenScroll={handleOpenScroll}
          />

          {/* Bottom Owner Control Dock */}
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 sm:bottom-5">
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5 rounded-full border border-amber-300/40 bg-slate-950/80 p-2 px-4 text-white shadow-2xl backdrop-blur-xl">
              {/* Watering Can Button for Owner */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.07, rotate: -6 }}
                whileTap={{ scale: 0.93 }}
                disabled={isSubmittingWater}
                onClick={handleOwnerWater}
                className="group relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-300/80 bg-gradient-to-br from-amber-400/35 via-orange-500/30 to-rose-600/35 shadow-lg shadow-amber-500/30 transition sm:h-16 sm:w-16"
              >
                <img
                  src="/assets/watering_can.png"
                  alt="Bình tưới Chủ vườn"
                  draggable={false}
                  className="h-11 w-11 object-contain drop-shadow-md transition-transform group-hover:-rotate-12 sm:h-13 sm:w-13"
                />
              </motion.button>

              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <button
                  type="button"
                  disabled={isSubmittingWater}
                  onClick={handleOwnerWater}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg transition hover:brightness-110 disabled:opacity-50 sm:text-sm"
                >
                  <Droplets className="h-4 w-4 text-slate-950" />
                  <span>Chủ Vườn Tưới Cây (+1)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-400/50 bg-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-100 transition hover:bg-rose-500/30"
                >
                  <Lock className="h-3.5 w-3.5 text-rose-300" />
                  <span>Thư bí mật ({secretNotesCount})</span>
                </button>

                <button
                  type="button"
                  onClick={handleLockGarden}
                  title="Khóa màn hình PIN"
                  className="inline-flex items-center justify-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/20"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Khóa PIN</span>
                </button>
              </div>
            </div>
          </div>

          {/* Drawer: Sổ Cành Vàng (Admin Full View + Filters) */}
          <BranchesDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            branches={branches}
            isAdmin={true}
            onOpenScroll={(branch) => {
              setIsDrawerOpen(false);
              handleOpenScroll(branch);
            }}
          />

          {/* Modal: Read Any Scroll (Public & Locked Secret) on /assets/scroll_open_bg.png */}
          <ScrollModal
            branch={activeScrollBranch}
            onClose={() => setActiveScrollBranch(null)}
          />
        </>
      )}
    </main>
  );
}

