"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  KeyRound,
  LogOut,
  ArrowLeft,
  Delete,
} from "lucide-react";
import MeadowBackground from "@/components/MeadowBackground";
import EnvironmentCanvas from "@/components/EnvironmentCanvas";
import TopHudBar from "@/components/TopHudBar";
import PhoenixTreeStage from "@/components/PhoenixTreeStage";
import BranchesDrawer from "@/components/BranchesDrawer";
import ScrollModal from "@/components/ScrollModal";
import { getTreeStageInfo } from "@/lib/treeConfig";

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
  const [ownerWateredToday, setOwnerWateredToday] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeScrollBranch, setActiveScrollBranch] = useState(null);
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

        const treeRes = await fetch("/api/tree", {
          headers: { "x-admin-pin": candidatePin },
          cache: "no-store",
        });
        const treeData = await treeRes.json();

        if (treeData.ok) {
          setTreeState(treeData.treeState);
          setBranches(treeData.branches || []);
          setOwnerWateredToday(
            Boolean(
              treeData.todayVN &&
                treeData.treeState?.lastOwnerWaterDate === treeData.todayVN
            )
          );
          setDbConfigWarning(treeData.dbConfigWarning || null);
        } else {
          setTreeState(data.treeState);
          setBranches(data.branches || []);
          setOwnerWateredToday(Boolean(data.ownerWateredToday));
          setDbConfigWarning(data.dbConfigWarning || null);
        }

        setVerifiedPin(candidatePin);
        setIsUnlocked(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("cay_phuong_admin_pin", candidatePin);
        }
        if (!silent) {
          showToast("Chào mừng Nam quay trở lại!", "success");
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
      const savedSessionPin = sessionStorage.getItem("cay_phuong_admin_pin");
      if (savedSessionPin && savedSessionPin.length === 6) {
        setPinInput(savedSessionPin);
        verifyAdminPin(savedSessionPin, true);
      }
    }
  }, [verifyAdminPin]);

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

    if (ownerWateredToday) {
      showToast(
        "Hôm nay bạn đã tưới cây rồi (1 lần/ngày). Hãy quay lại vào ngày mai nhé!",
        "error"
      );
      return;
    }

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
        if (data.alreadyWateredToday) {
          setOwnerWateredToday(true);
        }
        showToast(data.error || "Không thể tưới nước lúc này.", "error");
        return;
      }

      setTreeState(data.treeState);
      setBranches(data.branches || []);
      setOwnerWateredToday(true);
      if (data.dbConfigWarning) setDbConfigWarning(data.dbConfigWarning);

      setIsWatering(true);

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
        `Nam đã tưới cây! 🔥 Streak của Nam: ${data.treeState.streak} ngày.`,
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

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden select-none">
      {/* Background Bầu trời có mây & Bãi cỏ cho cả PC và Mobile */}
      <MeadowBackground />

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
              className="w-full max-w-sm rounded-3xl border border-amber-300/35 bg-slate-900 p-6 text-white shadow-2xl"
            >
              <div className="mb-5 flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/50 bg-amber-500/20 text-amber-300 shadow-lg">
                  <KeyRound className="h-7 w-7" />
                </div>
                <h1 className="text-lg font-extrabold text-amber-200 sm:text-xl">
                  Khu Vườn Của Nam
                </h1>
                <p className="mt-1 text-xs text-slate-300">
                  Nhập mã PIN 6 số để tưới cây, giữ chuỗi Streak & đọc toàn bộ
                  lời nhắn.
                </p>
              </div>

              <form onSubmit={handlePinFormSubmit} className="space-y-4">
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
                  className="w-full rounded-xl border border-white/15 bg-slate-800 px-3.5 py-2 text-center text-xs text-amber-100 placeholder-slate-400 outline-none focus:border-amber-400"
                />

                {pinError && (
                  <p className="rounded-xl border border-rose-400/40 bg-rose-500/20 px-3 py-2 text-center text-xs font-semibold text-rose-200">
                    {pinError}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleDigitPress(num)}
                      className="h-11 rounded-xl border border-white/15 bg-slate-800 text-base font-bold text-white transition hover:bg-slate-700 active:scale-95"
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
                    className="h-11 rounded-xl border border-white/15 bg-slate-800 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                  >
                    Xóa hết
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigitPress(0)}
                    className="h-11 rounded-xl border border-white/15 bg-slate-800 text-base font-bold text-white transition hover:bg-slate-700 active:scale-95"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    aria-label="Xóa 1 số"
                    className="flex h-11 items-center justify-center rounded-xl border border-white/15 bg-slate-800 text-slate-200 transition hover:bg-slate-700"
                  >
                    <Delete className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || pinInput.length !== 6}
                  className="w-full rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {isVerifying ? "Đang kiểm tra PIN..." : "Mở Khóa"}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-center border-t border-white/10 pt-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 transition hover:text-amber-300"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Chuyển sang trang thường (/)
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
            isAdminPage={true}
            branchCount={branches.length}
            onOpenBranchesDrawer={() => setIsDrawerOpen(true)}
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
                <span>{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 10-Stage Phoenix Tree, Icon Bình Tưới cạnh cây & Hoa Đỏ trên sân */}
          <PhoenixTreeStage
            totalCount={totalCount}
            branches={branches}
            isAdmin={true}
            isWatering={isWatering}
            disabledWater={isSubmittingWater}
            onWaterClick={handleOwnerWater}
            onOpenScroll={handleOpenScroll}
          />

          {/* Nút khóa PIN nhỏ gọn góc dưới phải cho Nam */}
          <div className="pointer-events-none absolute bottom-3 right-3 z-30">
            <button
              type="button"
              onClick={handleLockGarden}
              title="Khóa màn hình PIN"
              className="pointer-events-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 bg-slate-900/85 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-lg transition hover:bg-slate-800"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Khóa PIN</span>
            </button>
          </div>

          {/* Drawer danh sách toàn bộ lời nhắn & lượt tưới (chỉ có ở /admin) */}
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
