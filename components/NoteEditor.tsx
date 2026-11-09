"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DecryptedNote, exportNoteAsTxt, exportNoteAsZip } from "@/lib/export";
import { Language, translations } from "@/lib/i18n";

interface NoteEditorProps {
  lang: Language;
  note: DecryptedNote | null;
  onSave: (
    id: string,
    title: string,
    body: string,
    isPinned: boolean,
    expiresInHours?: number
  ) => Promise<void>;
  onDelete: (id: string) => void;
  onTogglePin: (note: DecryptedNote) => void;
}

const TTL_OPTIONS = [2, 4, 6, 8, 12, 24];

export function NoteEditor({
  lang,
  note,
  onSave,
  onDelete,
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
        <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-500 mb-2 font-bold">
          ✍
        </div>
        <p>{t.noNotes}</p>
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

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-zinc-800">
      {/* Top minimal status & actions */}
      <div className="px-6 py-2.5 border-b border-zinc-200/80 flex items-center justify-between text-xs text-zinc-600 select-none bg-white">
        <div className="flex items-center gap-3">
          <span
            className={`font-medium ${
              status === "saving"
                ? "text-orange-500"
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
            className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-semibold px-2.5 py-1 rounded-lg text-xs transition cursor-pointer"
          >
            {t.ttl}: {ttlHours}h
          </button>

          <span className="text-zinc-400">
            {wordCount} {t.words} • {charCount} {t.chars}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportNoteAsTxt(note)}
            className="bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            TXT
          </button>
          <button
            type="button"
            onClick={() => exportNoteAsZip(note)}
            className="bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            ZIP
          </button>
          <button
            type="button"
            onClick={() => onTogglePin(note)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              note.isPinned
                ? "bg-orange-100 text-orange-800"
                : "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700"
            }`}
          >
            {note.isPinned ? `★ ${t.unpin}` : `☆ ${t.pin}`}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(t.confirmDelete)) onDelete(note.id);
            }}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            {t.delete}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex flex-col px-8 py-6 max-w-4xl w-full mx-auto overflow-hidden">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={`${t.untitled}...`}
          className="w-full bg-transparent text-xl font-bold text-zinc-900 placeholder-zinc-300 focus:outline-none mb-4 pb-2 border-b border-transparent focus:border-zinc-200 transition"
        />

        <textarea
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder="Not içeriğinizi buraya yazın..."
          className="flex-1 w-full bg-transparent resize-none text-zinc-800 placeholder-zinc-300 focus:outline-none leading-relaxed text-sm"
        />
      </div>

      {/* Bottom Forensic Status Bar */}
      <div className="px-6 py-2 border-t border-zinc-100 text-[11px] text-zinc-400 bg-zinc-50/50 flex items-center justify-between select-none">
        <div className="truncate max-w-md">
          <span>{t.ipAddress}: {note.createdIp || "127.0.0.1"}</span>
          <span className="mx-2 text-zinc-300">•</span>
          <span className="truncate" title={note.userAgent || ""}>
            {t.device}: {note.userAgent ? note.userAgent.slice(0, 40) + "..." : "-"}
          </span>
        </div>
        <div>
          <span>{t.expiresAt}: {formatShortTime(note.expiresAt)}</span>
        </div>
      </div>
    </div>
  );
}
