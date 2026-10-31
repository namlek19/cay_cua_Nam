"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Droplets,
  User,
  UserX,
  Globe,
  Lock,
  Sparkles,
  Send,
} from "lucide-react";

export default function GuestWaterModal({
  isOpen,
  onClose,
  onSubmitWater,
  isSubmitting = false,
  myTodayWaterCount = 0,
}) {
  const [name, setName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [note, setNote] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("cay_phuong_guest_name");
      const savedAnon = localStorage.getItem("cay_phuong_guest_anon");
      if (savedName) setName(savedName);
      if (savedAnon === "true") setIsAnonymous(true);
    }
  }, []);

  const handleNameChange = (val) => {
    const sliced = val.slice(0, 40);
    setName(sliced);
    if (typeof window !== "undefined") {
      localStorage.setItem("cay_phuong_guest_name", sliced);
    }
  };

  const handleAnonToggle = (checked) => {
    setIsAnonymous(checked);
    if (typeof window !== "undefined") {
      localStorage.setItem("cay_phuong_guest_anon", String(checked));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || myTodayWaterCount >= 10) return;

    const success = await onSubmitWater({
      name: isAnonymous ? null : name,
      isAnonymous,
      note,
      isPublic,
    });

    if (success) {
      setNote("");
      onClose();
    }
  };

  const handleQuickWaterNoNote = async () => {
    if (isSubmitting || myTodayWaterCount >= 10) return;
    const success = await onSubmitWater({
      name: isAnonymous ? null : name,
      isAnonymous,
      note: "",
      isPublic: true,
    });
    if (success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="guest-water-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-amber-300/35 bg-slate-950/90 text-white shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-sky-500/20 via-amber-500/15 to-transparent px-5 py-4">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/watering_can.png"
                  alt="Bình tưới nước"
                  className="h-11 w-11 object-contain drop-shadow-md"
                />
                <div>
                  <h3 className="text-base font-bold text-amber-200 sm:text-lg">
                    Tưới Nước & Treo Lời Nhắn Cành Vàng
                  </h3>
                  <p className="text-xs text-sky-300">
                    Hôm nay bạn đã tưới: <b>{myTodayWaterCount}/10</b> lần
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 bg-white/10 p-2 text-slate-300 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 p-5">
              {/* Name & Anonymous Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                    Tên người tưới trên Cành Vàng
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAnonToggle(!isAnonymous)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                      isAnonymous
                        ? "border-amber-400 bg-amber-400/20 text-amber-200"
                        : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {isAnonymous ? (
                      <>
                        <UserX className="h-3.5 w-3.5 text-amber-300" />
                        Đang ẩn danh
                      </>
                    ) : (
                      <>
                        <User className="h-3.5 w-3.5 text-sky-300" />
                        Chế độ ẩn danh
                      </>
                    )}
                  </button>
                </div>

                {!isAnonymous ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Nhập tên của bạn (để trống = Người Ẩn Danh)..."
                      maxLength={40}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition focus:border-amber-400 focus:bg-white/15"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                      {name.length}/40
                    </span>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
                    Cành vàng sẽ hiển thị: <b>[Người Ẩn Danh đã tưới x lần]</b>
                  </div>
                )}
              </div>

              {/* Note Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                    Lời nhắn gửi vào Cuộn Thư (Không bắt buộc)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {note.length}/500 ký tự
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  placeholder="Viết đôi dòng kỷ niệm, lời chúc, hoặc tâm sự treo lên cành phượng vàng... (Để trống nếu bạn chỉ muốn tưới nước)"
                  maxLength={500}
                  className="w-full resize-none rounded-xl border border-white/20 bg-white/10 p-3.5 text-sm text-white placeholder-slate-400 outline-none transition focus:border-amber-400 focus:bg-white/15"
                />
              </div>

              {/* Privacy Selector (shown clearly when user writes a note or wants to pick scroll type) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                  Chế độ Cuộn Thư
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition ${
                      isPublic
                        ? "border-emerald-400 bg-emerald-500/20 shadow-md"
                        : "border-white/15 bg-white/5 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src="/assets/scroll_public.png"
                      alt="Cuộn thư công khai"
                      className="h-10 w-8 shrink-0 object-contain"
                    />
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-200">
                        <Globe className="h-3.5 w-3.5" />
                        Công khai
                      </div>
                      <p className="text-[11px] leading-tight text-slate-300">
                        Ai ghé thăm cây cũng đọc được
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition ${
                      !isPublic
                        ? "border-rose-400 bg-rose-500/20 shadow-md"
                        : "border-white/15 bg-white/5 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src="/assets/scroll_locked.png"
                      alt="Cuộn thư bí mật"
                      className="h-10 w-8 shrink-0 object-contain"
                    />
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-rose-200">
                        <Lock className="h-3.5 w-3.5" />
                        Bí mật
                      </div>
                      <p className="text-[11px] leading-tight text-slate-300">
                        Khóa xích, chỉ Chủ vườn đọc được
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <button
                  type="button"
                  disabled={isSubmitting || myTodayWaterCount >= 10}
                  onClick={handleQuickWaterNoNote}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 py-3 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Droplets className="h-4 w-4 text-sky-300" />
                  Chỉ tưới nước (Không ghi thư)
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || myTodayWaterCount >= 10}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {note.trim() !== "" ? (
                    <>
                      <Send className="h-4 w-4" />
                      {isSubmitting ? "Đang tưới..." : "Tưới & Treo Cuộn Thư"}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {isSubmitting ? "Đang tưới..." : "Tưới Nước Cho Cây"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

