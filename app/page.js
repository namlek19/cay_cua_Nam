"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Sparkles } from "lucide-react";
import MeadowBackground from "@/components/MeadowBackground";
import EnvironmentCanvas from "@/components/EnvironmentCanvas";
import TopHudBar from "@/components/TopHudBar";
import PhoenixTreeStage from "@/components/PhoenixTreeStage";
import GuestWaterModal from "@/components/GuestWaterModal";
import ScrollModal from "@/components/ScrollModal";
import { getTreeStageInfo } from "@/lib/treeConfig";

function getLocalTodayVN() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
}

function getOrCreateClientId() {
  if (typeof window === "undefined") return "";
  let cid = localStorage.getItem("cay_phuong_client_id");
  if (!cid) {
    cid = `cid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("cay_phuong_client_id", cid);
  }
  return cid;
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
  const [myTodayNote, setMyTodayNote] = useState(null);
  const [dbConfigWarning, setDbConfigWarning] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isWatering, setIsWatering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState("name");

  const [activeScrollBranch, setActiveScrollBranch] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

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
      const clientId = getOrCreateClientId();
      const res = await fetch("/api/tree", {
        headers: { "x-client-id": clientId },
        cache: "no-store",
      });
      const data = await res.json();
      if (data.ok) {
        setTreeState(data.treeState);
        setBranches(data.branches || []);
        setMyTodayNote(data.myTodayNote || null);
        if (data.myTodayNote && typeof window !== "undefined") {
          localStorage.setItem(
            "cay_phuong_note_sent_date",
            data.todayVN || getLocalTodayVN()
          );
        }
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
    fetchTreeData();
  }, [fetchTreeData]);

  const triggerWaterAnimation = (prevTotal, nextTotal) => {
    setIsWatering(true);

    const prevStage = getTreeStageInfo(prevTotal).stage;
    const nextStage = getTreeStageInfo(nextTotal).stage;

    if (nextStage > prevStage) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ["#fbbf24", "#ef4444", "#38bdf8", "#4ade80"],
      });
    }

    setTimeout(() => {
      setIsWatering(false);
    }, 1700);
  };

  // Khi ấn vào icon Bình tưới nước cạnh cây
  const handleWaterButtonClick = async () => {
    if (isSubmitting || isLoading) return;

    if (myTodayWaterCount >= 10) {
      showToast(
        "Hôm nay bạn đã tưới đủ 10/10 lần rồi, mai quay lại tưới tiếp nhé!",
        "warning"
      );
      return;
    }

    setIsSubmitting(true);
    const prevTotal =
      (treeState.ownerWaterCount || 0) + (treeState.guestWaterCount || 0);

    let savedName = "";
    let savedAnon = false;
    const clientId = getOrCreateClientId();
    if (typeof window !== "undefined") {
      savedName = localStorage.getItem("cay_phuong_guest_name") || "";
      savedAnon = localStorage.getItem("cay_phuong_guest_anon") === "true";
    }

    try {
      const res = await fetch("/api/water", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
        },
        body: JSON.stringify({
          name: savedAnon ? null : savedName,
          isAnonymous: savedAnon,
          note: "",
          isPublic: true,
        }),
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
        return;
      }

      setTreeState(data.treeState);
      setBranches(data.branches || []);
      setMyTodayNote(data.myTodayNote || null);
      if (data.dbConfigWarning) setDbConfigWarning(data.dbConfigWarning);

      const todayKey = data.todayVN || getLocalTodayVN();
      syncTodayWaterCount(data.myTodayWaterCount, todayKey);
      triggerWaterAnimation(prevTotal, data.treeState.totalCount);

      const alreadyNotedLocal =
        typeof window !== "undefined" &&
        localStorage.getItem("cay_phuong_note_sent_date") === todayKey;

      const alreadyAskedFirstTime =
        typeof window !== "undefined" &&
        localStorage.getItem("cay_phuong_asked_once_date") === todayKey;

      // Lần tưới đầu tiên trong ngày: Hỏi tên luôn -> hỏi xong mới hiện cái hỏi có note không
      if (
        data.myTodayWaterCount === 1 &&
        !data.myTodayNote &&
        !alreadyNotedLocal &&
        !alreadyAskedFirstTime
      ) {
        if (typeof window !== "undefined") {
          localStorage.setItem("cay_phuong_asked_once_date", todayKey);
        }
        setModalInitialMode("name");
        setIsWaterModalOpen(true);
      } else {
        showToast("Đã tưới nước giúp Nam thành công!", "success");
      }
    } catch {
      showToast("Có lỗi kết nối khi tưới cây, vui lòng thử lại!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Khi người dùng nghĩ lại và bấm vào bông hoa đỏ của mình (có dấu ! nhỏ) để viết hoặc sửa lời nhắn
  const handleClickMyBranch = () => {
    if (myTodayNote) {
      setModalInitialMode("form");
      setIsWaterModalOpen(true);
    } else {
      setModalInitialMode("ask");
      setIsWaterModalOpen(true);
    }
  };

  const handleSaveNameOnly = async ({ name, isAnonymous }) => {
    const clientId = getOrCreateClientId();
    try {
      const res = await fetch("/api/water", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
        },
        body: JSON.stringify({
          name,
          isAnonymous,
          updateNameOnly: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setBranches(data.branches || []);
      }
    } catch {
      // Ignore silent name update error
    }
  };

  const handleSaveNote = async ({ name, isAnonymous, note, isPublic }) => {
    setIsSubmitting(true);
    const clientId = getOrCreateClientId();
    try {
      const res = await fetch("/api/water", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
        },
        body: JSON.stringify({
          name,
          isAnonymous,
          note,
          isPublic,
          isEdit: Boolean(myTodayNote),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        showToast(data.error || "Không thể lưu lời nhắn.", "error");
        return false;
      }

      setBranches(data.branches || []);
      setMyTodayNote(data.myTodayNote || null);
      if (typeof window !== "undefined") {
        localStorage.setItem("cay_phuong_note_sent_date", getLocalTodayVN());
      }
      showToast("Đã lưu lời nhắn của bạn bên bông hoa đỏ!", "success");
      return true;
    } catch {
      showToast("Lỗi kết nối khi lưu lời nhắn.", "error");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    setIsSubmitting(true);
    const clientId = getOrCreateClientId();
    try {
      const res = await fetch("/api/water", {
        method: "DELETE",
        headers: { "x-client-id": clientId },
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        showToast(data.error || "Không thể xóa lời nhắn.", "error");
        return false;
      }

      setBranches(data.branches || []);
      setMyTodayNote(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("cay_phuong_note_sent_date");
      }
      showToast("Đã xóa lời nhắn của bạn.", "success");
      return true;
    } catch {
      showToast("Lỗi kết nối khi xóa lời nhắn.", "error");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenScroll = (branch) => {
    if (!branch) return;
    if (branch.isPublic === false) return;
    setActiveScrollBranch(branch);
  };

  const totalCount =
    (treeState.ownerWaterCount || 0) + (treeState.guestWaterCount || 0);

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden select-none">
      {/* Background Bầu trời có mây & Bãi cỏ cho cả PC và Mobile */}
      <MeadowBackground />

      {/* Ambient Sparkles, Falling Petals (Stage 6+) & Water Splash Layer */}
      <EnvironmentCanvas totalCount={totalCount} isWatering={isWatering} />

      {/* Top HUD Bar */}
      <TopHudBar
        totalCount={totalCount}
        ownerWaterCount={treeState.ownerWaterCount || 0}
        guestWaterCount={treeState.guestWaterCount || 0}
        streak={treeState.streak || 0}
        isAdminPage={false}
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

      {/* Centerpiece: 10-Stage Phoenix Tree, Icon Bình Tưới cạnh cây & Hoa Đỏ trên sân */}
      <PhoenixTreeStage
        totalCount={totalCount}
        branches={branches}
        isAdmin={false}
        isWatering={isWatering}
        disabledWater={isSubmitting || isLoading}
        onWaterClick={handleWaterButtonClick}
        onOpenScroll={handleOpenScroll}
        onClickMyBranch={handleClickMyBranch}
      />

      {/* Pop-up hỏi tên -> hỏi có muốn note không -> Bảng để lại lời nhắn */}
      <GuestWaterModal
        isOpen={isWaterModalOpen}
        initialMode={modalInitialMode}
        existingNote={myTodayNote}
        onClose={() => setIsWaterModalOpen(false)}
        onSaveNameOnly={handleSaveNameOnly}
        onSaveNote={handleSaveNote}
        onDeleteNote={handleDeleteNote}
        isSubmitting={isSubmitting}
      />

      {/* Modal: Read Scroll Note on /assets/scroll_open_bg.png */}
      <ScrollModal
        branch={activeScrollBranch}
        onClose={() => setActiveScrollBranch(null)}
      />
    </main>
  );
}
