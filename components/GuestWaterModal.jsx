"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, UserX, Globe, Lock, Trash2 } from "lucide-react";

export default function GuestWaterModal({
  isOpen,
  initialMode = "name", // "name" | "ask" | "form"
  existingNote = null,
  onClose,
  onSaveNameOnly,
  onSaveNote,
  onDeleteNote,
  isSubmitting = false,
}) {
  const [step, setStep] = useState(initialMode); // "name" | "ask" | "form"
  const [name, setName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showConfirmAnon, setShowConfirmAnon] = useState(false);
  const [note, setNote] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setStep(initialMode);
      setShowConfirmAnon(false);
      if (existingNote) {
        setName(existingNote.name || "");
        setIsAnonymous(Boolean(existingNote.isAnonymous));
        setNote(existingNote.note || "");
        setIsPublic(existingNote.isPublic !== false);
      } else {
        setNote("");
        setIsPublic(true);
        if (typeof window !== "undefined") {
          const savedName = localStorage.getItem("cay_phuong_guest_name") || "";
          const savedAnon =
            localStorage.getItem("cay_phuong_guest_anon") === "true";
          setName(savedName);
          setIsAnonymous(savedAnon);
        }
      }
    }
  }, [isOpen, initialMode, existingNote]);

  const handleNameChange = (val) => {
    const sliced = val.slice(0, 40);
    setName(sliced);
    if (typeof window !== "undefined") {
      localStorage.setItem("cay_phuong_guest_name", sliced);
    }
  };

  const applyAnonymousState = (anonVal) => {
    setIsAnonymous(anonVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("cay_phuong_guest_anon", String(anonVal));
    }
  };

  // Bước 1: Hỏi tên xong -> Lưu tên cho lượt tưới rồi chuyển sang hỏi có note không
  const handleConfirmNameStep = async (e) => {
    e.preventDefault();
    const finalAnon = isAnonymous || !name.trim();
    applyAnonymousState(finalAnon);

    if (onSaveNameOnly) {
      await onSaveNameOnly({
        name: finalAnon ? null : name.trim(),
        isAnonymous: finalAnon,
      });
    }
    setStep("ask");
  };

  // Khi bấm nút ẩn danh ở bảng viết lời nhắn -> Hỏi có muốn chuyển thành ẩn danh cho cả lượt tưới không
  const handleAnonClickInForm = () => {
    if (!isAnonymous) {
      setShowConfirmAnon(true);
    } else {
      applyAnonymousState(false);
      setShowConfirmAnon(false);
    }
  };

  const handleConfirmSwitchToAnon = async () => {
    applyAnonymousState(true);
    setShowConfirmAnon(false);
    if (onSaveNameOnly) {
      await onSaveNameOnly({
        name: null,
        isAnonymous: true,
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !note.trim()) return;

    const finalAnon = isAnonymous || !name.trim();
    const success = await onSaveNote({
      name: finalAnon ? null : name.trim(),
      isAnonymous: finalAnon,
      note,
      isPublic,
    });

    if (success) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (isSubmitting || !onDeleteNote) return;
    const success = await onDeleteNote();
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-xs sm:p-4"
        >
          {step === "name" && (
            /* Bước 1: Hỏi tên người tưới lần đầu */
            <motion.div
              key="name-popup"
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/20 bg-slate-900 p-5 text-white shadow-2xl"
            >
              <h3 className="text-center text-base font-bold text-amber-200 sm:text-lg">
                Tên bạn là gì nhỉ?
              </h3>
              <p className="mt-1 text-center text-xs text-slate-300">
                Để Nam gắn tên bạn lên bông hoa vừa nở trên sân nhé!
              </p>

              <form onSubmit={handleConfirmNameStep} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-amber-200">
                      Tên bạn là
                    </label>
                    <button
                      type="button"
                      onClick={() => applyAnonymousState(!isAnonymous)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                        isAnonymous
                          ? "border-amber-400 bg-amber-500/20 text-amber-200"
                          : "border-white/15 bg-slate-800 text-slate-300 hover:bg-slate-700"
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
                        placeholder="Nhập tên của bạn (để trống = Ẩn danh)..."
                        maxLength={40}
                        autoFocus
                        className="w-full rounded-xl border border-white/20 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition focus:border-amber-400"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                        {name.length}/40
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-400/25 bg-slate-800 px-4 py-2.5 text-xs text-amber-200">
                      Hiển thị trên hoa: <b>[Người ẩn danh đã tưới x lần]</b>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  Tiếp tục
                </button>
              </form>
            </motion.div>
          )}

          {step === "ask" && (
            /* Bước 2: Hỏi có muốn để lại lời nhắn cho Nam không? */
            <motion.div
              key="ask-popup"
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/20 bg-slate-900 p-5 text-center text-white shadow-2xl"
            >
              <p className="text-base font-bold text-amber-200 sm:text-lg">
                Bạn có muốn để lại lời nhắn cho Nam không?
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Một bông hoa đỏ của{" "}
                <b>
                  {isAnonymous || !name.trim() ? "Người ẩn danh" : name.trim()}
                </b>{" "}
                đã mọc trên sân rồi đó!
              </p>

              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-white/20 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  Không
                </button>
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
                >
                  Có
                </button>
              </div>
            </motion.div>
          )}

          {step === "form" && (
            /* Bước 3: Bảng để lại lời nhắn đơn giản, không gradient */
            <motion.div
              key="note-form-modal"
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-slate-900 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 bg-slate-900 px-5 py-4">
                <h3 className="text-base font-bold text-amber-200 sm:text-lg">
                  Để lại lời nhắn của bạn nhaaaa
                </h3>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/15 bg-slate-800 p-1.5 text-slate-300 transition hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 p-5">
                {/* Tên bạn là & Nút ẩn danh */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-amber-200">
                      Tên bạn là
                    </label>
                    <button
                      type="button"
                      onClick={handleAnonClickInForm}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                        isAnonymous
                          ? "border-amber-400 bg-amber-500/20 text-amber-200"
                          : "border-white/15 bg-slate-800 text-slate-300 hover:bg-slate-700"
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

                  {/* Hỏi xác nhận khi người dùng bấm chuyển sang ẩn danh */}
                  {showConfirmAnon && (
                    <div className="rounded-xl border border-amber-400/40 bg-slate-800 p-3 text-xs text-slate-200">
                      <p className="font-semibold text-amber-200">
                        Bạn có muốn chuyển thành ẩn danh không? (Sẽ đổi tên
                        thành Người ẩn danh cho cả lượt tưới này)
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmSwitchToAnon}
                          className="rounded-lg bg-amber-500 px-3 py-1 font-bold text-slate-950 transition hover:bg-amber-400"
                        >
                          Có, chuyển thành ẩn danh
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmAnon(false)}
                          className="rounded-lg border border-white/20 bg-slate-700 px-3 py-1 font-medium text-slate-200 transition hover:bg-slate-600"
                        >
                          Không
                        </button>
                      </div>
                    </div>
                  )}

                  {!isAnonymous ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Nhập tên của bạn..."
                        maxLength={40}
                        className="w-full rounded-xl border border-white/20 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition focus:border-amber-400"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                        {name.length}/40
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-400/25 bg-slate-800 px-4 py-2.5 text-xs text-amber-200">
                      Đang để tên: <b>Người ẩn danh</b> (cho cả lượt tưới và lời
                      nhắn)
                    </div>
                  )}
                </div>

                {/* Lời nhắn */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-amber-200">
                      Lời nhắn
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {note.length}/500 ký tự
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 500))}
                    placeholder="Viết lời nhắn gửi cho Nam..."
                    maxLength={500}
                    required
                    className="w-full resize-none rounded-xl border border-white/20 bg-slate-800 p-3.5 text-sm text-white placeholder-slate-400 outline-none transition focus:border-amber-400"
                  />
                </div>

                {/* Bạn có muốn cho người khác đọc text không? */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-amber-200">
                    Bạn có muốn cho người khác đọc text không?
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsPublic(true)}
                      className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${
                        isPublic
                          ? "border-emerald-400 bg-emerald-950/60"
                          : "border-white/15 bg-slate-800 opacity-75 hover:opacity-100"
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
                      className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${
                        !isPublic
                          ? "border-rose-400 bg-rose-950/60"
                          : "border-white/15 bg-slate-800 opacity-75 hover:opacity-100"
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
                          chỉ Nam được đọc
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 pt-1">
                  {existingNote && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleDelete}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-400/40 bg-rose-950/60 px-4 py-2.5 text-xs font-bold text-rose-200 transition hover:bg-rose-900/70 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa lời nhắn
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !note.trim()}
                    className="flex-1 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Đang lưu..."
                      : existingNote
                        ? "Lưu sửa đổi"
                        : "Lưu lời nhắn"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
