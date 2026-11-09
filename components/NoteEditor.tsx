"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DecryptedNote, exportNoteAsTxt, exportNoteAsZip } from "@/lib/export";
import { Language, translations } from "@/lib/i18n";

interface NoteEditorProps {
  lang: Language;
  note: DecryptedNote | null;
  theme?: string;
  onSave: (
    id: string,
    title: string,
    body: string,
    isPinned: boolean,
    expiresInHours?: number
  ) => Promise<void>;
  onRequestDelete: (note: DecryptedNote) => void;
  onTogglePin: (note: DecryptedNote) => void;
}

const TTL_OPTIONS = [2, 4, 6, 8, 12, 24];

export function NoteEditor({
  lang,
  note,
  theme = "clean",
  onSave,
  onRequestDelete,
  onTogglePin,
}: NoteEditorProps) {
  const t = translations[lang];
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ttlHours, setTtlHours] = useState<number>(24);
  const [status, setStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBody(note.body);
      setStatus("saved");

      if (note.expiresAt) {
        const diffHours = Math.round(
          (new Date(note.expiresAt).getTime() - Date.now()) / (3600 * 1000)
        );
        const closest = TTL_OPTIONS.reduce((prev, curr) =>
          Math.abs(curr - diffHours) < Math.abs(prev - diffHours) ? curr : prev
        );
        setTtlHours(closest);
      }
    } else {
      setTitle("");
      setBody("");
      setStatus("saved");
    }
  }, [note?.id]);

  const triggerSave = useCallback(
    async (newTitle: string, newBody: string, hours?: number) => {
      if (!note) return;
      setStatus("saving");
      try {
        await onSave(note.id, newTitle, newBody, note.isPinned, hours || ttlHours);
        setStatus("saved");
      } catch {
        setStatus("unsaved");
      }
    },
    [note, onSave, ttlHours]
  );

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setStatus("unsaved");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      triggerSave(val, body);
    }, 600);
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    setStatus("unsaved");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      triggerSave(title, val);
    }, 600);
  };

  const handleTtlCycle = () => {
    const nextIdx = (TTL_OPTIONS.indexOf(ttlHours) + 1) % TTL_OPTIONS.length;
    const nextTtl = TTL_OPTIONS[nextIdx];
    setTtlHours(nextTtl);
    triggerSave(title, body, nextTtl);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (note) triggerSave(title, body);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [note, title, body, triggerSave]);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-zinc-400 text-sm select-none">
        <p className="text-zinc-400 font-medium">{t.noNotes}</p>
      </div>
    );
  }

  const formatShortTime = (iso?: string) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString("tr-TR")} ${d.toLocaleTimeString("tr-TR")}`;
    } catch {
      return iso;
    }
  };

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charCount = body.length;

  // Theme configuration
  const isDark = theme === "dark";
  const isSepia = theme === "sepia";
  const isGlass = theme === "glass";
  const isDots = theme === "dots";
  const isLines = theme === "lines";

  let containerBg = "bg-white text-zinc-900";
  let headerBg = "bg-white border-zinc-200/80 text-zinc-600";
  let footerBg = "bg-zinc-50/50 border-zinc-100 text-zinc-400";
  let titleColor = "text-zinc-900 placeholder-zinc-300";
  let bodyColor = "text-zinc-800 placeholder-zinc-300";
  let btnBg = "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700";

  if (isDark) {
    containerBg = "bg-[#09090b] text-zinc-100";
    headerBg = "bg-[#111114] border-zinc-800 text-zinc-400";
    footerBg = "bg-[#111114] border-zinc-800 text-zinc-500";
    titleColor = "text-zinc-100 placeholder-zinc-700";
    bodyColor = "text-zinc-200 placeholder-zinc-700";
    btnBg = "bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-800";
  } else if (isSepia) {
    containerBg = "bg-[#fcf8ed] text-[#3e382d]";
    headerBg = "bg-[#f5efde] border-[#e2d8c3] text-[#6b6251]";
    footerBg = "bg-[#f5efde] border-[#e2d8c3] text-[#8c826e]";
    titleColor = "text-[#2e2920] placeholder-[#b3a895]";
    bodyColor = "text-[#3e382d] placeholder-[#b3a895]";
    btnBg = "bg-[#efe5ce] hover:bg-[#e4dac0] text-[#4d4434]";
  } else if (isGlass) {
    containerBg = "bg-white/60 backdrop-blur-xl text-zinc-900 relative overflow-hidden";
    headerBg = "bg-white/70 backdrop-blur-md border-zinc-200/60 text-zinc-600";
    footerBg = "bg-white/70 backdrop-blur-md border-zinc-200/60 text-zinc-500";
    titleColor = "text-zinc-900 placeholder-zinc-400";
    bodyColor = "text-zinc-800 placeholder-zinc-400";
    btnBg = "bg-white/80 hover:bg-white text-zinc-700 border border-zinc-200/60";
  }

  const editorPatternStyle: React.CSSProperties = isDots
    ? {
        backgroundImage: "radial-gradient(#d4d4d8 1.2px, transparent 1.2px)",
        backgroundSize: "20px 20px",
      }
    : isLines
    ? {
        backgroundImage: "linear-gradient(to bottom, transparent 27px, #e4e4e7 28px)",
        backgroundSize: "100% 28px",
        lineHeight: "28px",
      }
    : {};

  return (
    <div className={`flex-1 flex flex-col h-full relative ${containerBg}`}>
      {isGlass && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-25"
        >
          <source src="/rain.mp4" type="video/mp4" />
          <source src="/bg.mp4" type="video/mp4" />
        </video>
      )}

      {/* Top action bar */}
      <div
        className={`relative z-10 px-8 py-3 border-b flex items-center justify-between text-xs select-none transition-colors ${headerBg}`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`font-semibold ${
              status === "saving"
                ? "text-zinc-500"
                : status === "unsaved"
                ? "text-amber-500"
                : "text-emerald-600"
            }`}
          >
            ● {status === "saving" ? t.saving : status === "unsaved" ? t.unsaved : t.saved}
          </span>

          <button
            onClick={handleTtlCycle}
            title="Süreyi değiştir"
            className={`${btnBg} font-medium px-3 py-1 rounded-xl text-xs active:scale-[0.98] transition-all duration-150 cursor-pointer`}
          >
            {t.ttl}: {ttlHours}h
          </button>

          <span className="text-zinc-400 text-xs">
            {wordCount} {t.words} • {charCount} {t.chars}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportNoteAsTxt(note)}
            className={`${btnBg} px-3 py-1 rounded-xl text-xs font-medium active:scale-[0.98] transition-all duration-150 cursor-pointer`}
          >
            TXT
          </button>
          <button
            type="button"
            onClick={() => exportNoteAsZip(note)}
            className={`${btnBg} px-3 py-1 rounded-xl text-xs font-medium active:scale-[0.98] transition-all duration-150 cursor-pointer`}
          >
            ZIP
          </button>
          <button
            type="button"
            onClick={() => onTogglePin(note)}
            className={`px-3 py-1 rounded-xl text-xs font-medium active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
              note.isPinned
                ? "bg-zinc-900 text-white"
                : btnBg
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill={note.isPinned ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {note.isPinned ? t.unpin : t.pin}
          </button>
          <button
            type="button"
            onClick={() => onRequestDelete(note)}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-xl text-xs font-medium active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5"
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
            </svg>
            {t.delete}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div
        className="relative z-10 flex-1 flex flex-col px-10 py-8 max-w-4xl w-full mx-auto overflow-hidden transition-all"
        style={editorPatternStyle}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={`${t.untitled}...`}
          className={`w-full bg-transparent text-2xl font-bold ${titleColor} focus:outline-none mb-4 pb-2 border-b border-transparent focus:border-zinc-300/40 transition tracking-tight`}
        />

        <textarea
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder="Not içeriğinizi buraya yazın..."
          className={`flex-1 w-full bg-transparent resize-none ${bodyColor} focus:outline-none leading-relaxed text-sm font-normal`}
        />
      </div>

      {/* Bottom Forensic Status Bar */}
      <div
        className={`relative z-10 px-8 py-2.5 border-t text-xs flex items-center justify-between select-none transition-colors ${footerBg}`}
      >
        <div className="truncate max-w-md">
          <span>{t.ipAddress}: <strong className="font-medium text-zinc-600 dark:text-zinc-400">{note.createdIp || "127.0.0.1"}</strong></span>
          <span className="mx-2 opacity-40">•</span>
          <span className="truncate" title={note.userAgent || ""}>
            {t.device}: {note.userAgent ? note.userAgent.slice(0, 40) + "..." : "-"}
          </span>
        </div>
        <div>
          <span>{t.expiresAt}: <strong className="font-medium text-zinc-600 dark:text-zinc-400">{formatShortTime(note.expiresAt)}</strong></span>
        </div>
      </div>
    </div>
  );
}
