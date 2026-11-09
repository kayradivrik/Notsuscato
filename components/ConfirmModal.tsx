"use client";

import { useEffect } from "react";
import { Language, translations } from "@/lib/i18n";

interface ConfirmModalProps {
  isOpen: boolean;
  lang: Language;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  lang,
  title,
  description,
  confirmText,
  cancelText,
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const t = translations[lang];

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm bg-white border border-zinc-200/90 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 text-red-600">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
              {title || t.deleteNoteConfirmTitle}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-normal">
              {description || t.deleteNoteConfirmDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 active:scale-[0.98] transition cursor-pointer"
          >
            {cancelText || t.cancelBtn}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium text-white shadow-xs active:scale-[0.98] transition cursor-pointer ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-zinc-900 hover:bg-zinc-800"
            }`}
          >
            {confirmText || t.deleteConfirmBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
