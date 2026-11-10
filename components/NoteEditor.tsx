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
  onBack?: () => void;
}

const TTL_OPTIONS = [2, 4, 6, 8, 12, 24];

export function NoteEditor({
  lang,
  note,
  theme = "clean",
  onSave,
  onRequestDelete,
  onTogglePin,
  onBack,
}: NoteEditorProps) {
  const t = translations[lang];
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ttlHours, setTtlHours] = useState<number>(24);
  const [status, setStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [copied, setCopied] = useState(false);
  const [liveCountdown, setLiveCountdown] = useState<string>("");

  // Share Modal & Status
  const [showShareModal, setShowShareModal] = useState(false);
  const [isShared, setIsShared] = useState(Boolean(note?.isShared));
  const [shareId, setShareId] = useState<string | null>(note?.shareId || null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBody(note.body);
      setIsShared(Boolean(note.isShared));
      setShareId(note.shareId || null);
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
      setIsShared(false);
      setShareId(null);
      setStatus("saved");
    }
  }, [note?.id, note?.isShared, note?.shareId]);

  // Live expiration timer (exact hours, minutes, seconds)
  useEffect(() => {
    if (!note?.expiresAt) {
      setLiveCountdown("");
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const exp = new Date(note.expiresAt!).getTime();
      const diff = exp - now;

      if (diff <= 0) {
        setLiveCountdown("00:00:00");
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, "0");
      setLiveCountdown(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [note?.expiresAt]);

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

  // Formatting helper: wraps or prefixes text in the textarea
  const applyFormatting = (prefix: string, suffix: string = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = el.value;
    const selected = current.substring(start, end);

    let nextText: string;
    let nextPos: number;

    if (prefix === "- [ ] ") {
      const lineStart = current.lastIndexOf("\n", start - 1) + 1;
      nextText = current.slice(0, lineStart) + "- [ ] " + current.slice(lineStart);
      nextPos = start + 6;
    } else {
      nextText = current.substring(0, start) + prefix + selected + suffix + current.substring(end);
      nextPos = selected ? end + prefix.length + suffix.length : start + prefix.length;
    }

    setBody(nextText);
    setStatus("unsaved");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      triggerSave(title, nextText);
    }, 600);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  // Keyboard shortcuts (Ctrl+S, Ctrl+B, Ctrl+I)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") {
          e.preventDefault();
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          if (note) triggerSave(title, body);
        } else if (e.key === "b" && document.activeElement === textareaRef.current) {
          e.preventDefault();
          applyFormatting("**", "**");
        } else if (e.key === "i" && document.activeElement === textareaRef.current) {
          e.preventDefault();
          applyFormatting("*", "*");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [note, title, body, triggerSave]);

  // One-click clipboard copy
  const handleCopyNote = async () => {
    if (!body && !title) return;
    const text = title ? `${title}\n\n${body}` : body;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Toggle note public sharing
  const handleToggleShare = async () => {
    if (!note) return;
    setShareLoading(true);
    try {
      const res = await fetch(`/api/notes/${note.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !isShared }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsShared(data.isShared);
        setShareId(data.shareId);
        note.isShared = data.isShared;
        note.shareId = data.shareId;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setShareLoading(false);
    }
  };

  // Copy share URL
  const handleCopyShareLink = async () => {
    if (!shareId) return;
    const url = `${window.location.origin}/s/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Theme configuration
  const isDark = theme === "dark";
  const isSepia = theme === "sepia";
  const isGlass = theme === "glass";
  const isDots = theme === "dots";
  const isLines = theme === "lines";

  let containerBg = "bg-white text-zinc-900";
  let headerBg = "bg-white border-zinc-200/80 text-zinc-600";
  let titleColor = "text-zinc-900 placeholder-zinc-300";
  let bodyColor = "text-zinc-800 placeholder-zinc-300";
  let btnBg = "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700";

  if (isDark) {
    containerBg = "bg-[#09090b] text-zinc-100";
    headerBg = "bg-[#111114] border-zinc-800 text-zinc-400";
    titleColor = "text-zinc-100 placeholder-zinc-700";
    bodyColor = "text-zinc-200 placeholder-zinc-700";
    btnBg = "bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-800";
  } else if (isSepia) {
    containerBg = "bg-[#fcf8ed] text-[#3e382d]";
    headerBg = "bg-[#f5efde] border-[#e2d8c3] text-[#6b6251]";
    titleColor = "text-[#2e2920] placeholder-[#b3a895]";
    bodyColor = "text-[#3e382d] placeholder-[#b3a895]";
    btnBg = "bg-[#efe5ce] hover:bg-[#e4dac0] text-[#4d4434]";
  } else if (isGlass) {
    containerBg = "bg-white/60 backdrop-blur-xl text-zinc-900 relative overflow-hidden";
    headerBg = "bg-white/70 backdrop-blur-md border-zinc-200/60 text-zinc-600";
    titleColor = "text-zinc-900 placeholder-zinc-400";
    bodyColor = "text-zinc-800 placeholder-zinc-400";
    btnBg = "bg-white/80 hover:bg-white text-zinc-700 border border-zinc-200/60";
  }

  if (!note) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center text-zinc-400 text-sm select-none min-w-0 ${containerBg}`}>
        <p className="text-zinc-400 font-medium">{t.noNotes}</p>
      </div>
    );
  }

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charCount = body.length;

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
    <div className={`flex-1 flex flex-col h-full relative overflow-hidden min-w-0 ${containerBg}`}>
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
        className={`relative z-10 px-3 sm:px-6 py-2.5 sm:py-3 border-b flex items-center justify-between text-xs select-none transition-colors gap-2 overflow-x-auto min-w-0 ${headerBg}`}
      >
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden flex items-center gap-1 font-semibold text-xs text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-xl active:scale-95 transition cursor-pointer shrink-0"
              title={t.backToNotes}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>{t.backToNotes}</span>
            </button>
          )}

          <span
            className={`font-semibold text-xs ${
              status === "saving"
                ? "text-zinc-500"
                : status === "unsaved"
                ? "text-amber-500"
                : "text-emerald-600"
            }`}
          >
            ● {status === "saving" ? t.saving : status === "unsaved" ? t.unsaved : t.saved}
          </span>

          {note.expiresAt ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleTtlCycle}
                title="Süreyi değiştir (2, 4, 6, 8, 12, 24 saat)"
                className={`${btnBg} font-medium px-3 py-1 rounded-xl text-xs active:scale-[0.98] transition-all duration-150 cursor-pointer`}
              >
                {t.ttl}: {ttlHours}h
              </button>
              {liveCountdown && (
                <span
                  title={t.remainingExact}
                  className="font-mono text-[11px] text-zinc-500 font-semibold px-2 py-0.5 rounded-lg bg-zinc-100/70 border border-zinc-200/50 hidden sm:inline-block"
                >
                  ⏱️ {liveCountdown}
                </span>
              )}
            </div>
          ) : (
            <div
              title="Bu not yöneticiye aittir ve asla silinmez"
              className={`${btnBg} font-medium px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 cursor-default select-none`}
            >
              <span className="text-emerald-500 font-bold text-sm leading-none">∞</span>
              <span>{t.permanent}</span>
            </div>
          )}

          <span className="text-zinc-400 text-xs hidden lg:inline-block">
            {wordCount} {t.words} • {charCount} {t.chars}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyNote}
            title={t.copy}
            className={`${btnBg} px-2.5 sm:px-3 py-1 rounded-xl text-xs font-medium active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center gap-1.5`}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-emerald-600 font-semibold">{t.copied}</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>{t.copy}</span>
              </>
            )}
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            title={t.share}
            className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-medium active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
              isShared
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold"
                : btnBg
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>{t.share}</span>
            {isShared && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          </button>

          {/* TXT / ZIP */}
          <button
            type="button"
            onClick={() => exportNoteAsTxt(note)}
            className={`${btnBg} px-2.5 sm:px-3 py-1 rounded-xl text-xs font-medium active:scale-[0.98] transition-all duration-150 cursor-pointer hidden sm:inline-block`}
          >
            TXT
          </button>
          <button
            type="button"
            onClick={() => exportNoteAsZip(note)}
            className={`${btnBg} px-2.5 sm:px-3 py-1 rounded-xl text-xs font-medium active:scale-[0.98] transition-all duration-150 cursor-pointer hidden sm:inline-block`}
          >
            ZIP
          </button>

          {/* Pin */}
          <button
            type="button"
            onClick={() => onTogglePin(note)}
            className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-medium active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
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
            <span className="hidden sm:inline">{note.isPinned ? t.unpin : t.pin}</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onRequestDelete(note)}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-medium active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center gap-1.5"
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
            <span className="hidden sm:inline">{t.delete}</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div
        className="relative z-10 flex-1 flex flex-col px-4 sm:px-10 py-4 sm:py-8 max-w-4xl w-full mx-auto overflow-hidden transition-all"
        style={editorPatternStyle}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={`${t.untitled}...`}
          className={`w-full bg-transparent text-xl sm:text-2xl font-bold ${titleColor} focus:outline-none mb-2 pb-2 border-b border-transparent focus:border-zinc-300/40 transition tracking-tight`}
        />

        {/* Lightweight Formatting Micro-Toolbar */}
        <div className="flex items-center gap-1 mb-3 text-xs text-zinc-400 select-none">
          <button
            type="button"
            onClick={() => applyFormatting("**", "**")}
            title={t.boldTooltip}
            className="px-2 py-0.5 rounded-md hover:bg-zinc-200/50 hover:text-zinc-800 font-bold transition cursor-pointer text-[11px]"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => applyFormatting("*", "*")}
            title={t.italicTooltip}
            className="px-2 py-0.5 rounded-md hover:bg-zinc-200/50 hover:text-zinc-800 italic font-serif transition cursor-pointer text-[11px]"
          >
            I
          </button>
          <span className="text-zinc-300">|</span>
          <button
            type="button"
            onClick={() => applyFormatting("- [ ] ")}
            title={t.checklistTooltip}
            className="px-2 py-0.5 rounded-md hover:bg-zinc-200/50 hover:text-zinc-800 transition cursor-pointer text-[11px] flex items-center gap-1"
          >
            <span className="font-mono">☑</span>
            <span>Liste</span>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder="Not içeriğinizi buraya yazın..."
          className={`flex-1 w-full bg-transparent resize-none ${bodyColor} focus:outline-none leading-relaxed text-sm font-normal`}
        />
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">{t.shareLink}</h3>
                  <p className="text-[11px] text-zinc-400">Salt okunur geçici bağlantı</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Share Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <div>
                  <span className="text-xs font-semibold block text-zinc-800">
                    {isShared ? t.shareActive : t.shareInactive}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {isShared ? "Bağlantı aktif ve erişilebilir" : "Bağlantı şu an kapalı"}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={shareLoading}
                  onClick={handleToggleShare}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95 ${
                    isShared
                      ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                      : "bg-zinc-900 hover:bg-zinc-800 text-white"
                  }`}
                >
                  {shareLoading ? "..." : isShared ? "Kapat" : "Paylaşımı Aç"}
                </button>
              </div>

              {/* Share URL & Actions */}
              {isShared && shareId && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== "undefined" ? `${window.location.origin}/s/${shareId}` : `/s/${shareId}`}
                      className="flex-1 bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono text-zinc-800 select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-2 rounded-xl text-xs font-medium transition active:scale-95 cursor-pointer shrink-0"
                    >
                      {linkCopied ? t.linkCopied : t.copyLink}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <a
                      href={`/s/${shareId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-zinc-900 underline text-[11px]"
                    >
                      ↗ Yeni sekmede aç ve önizle
                    </a>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-100 pt-3">
                {t.shareDesc} Notun belirlenen imha süresi dolduğunda bu bağlantı da otomatik olarak geçersiz kılınır.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
