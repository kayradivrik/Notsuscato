"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DecryptedNote, exportNoteAsTxt, exportNoteAsZip } from "@/lib/export";

interface NoteEditorProps {
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
  note,
  onSave,
  onDelete,
  onTogglePin,
}: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ttlHours, setTtlHours] = useState<number>(24);
  const [status, setStatus] = useState<"kaydedildi" | "..." | "kaydedilmedi">("kaydedildi");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBody(note.body);
      setStatus("kaydedildi");

      // Calculate approximate TTL remaining if exists
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
      setStatus("kaydedildi");
    }
  }, [note?.id]);

  const triggerSave = useCallback(
    async (newTitle: string, newBody: string, hours?: number) => {
      if (!note) return;
      setStatus("...");
      try {
        await onSave(note.id, newTitle, newBody, note.isPinned, hours || ttlHours);
        setStatus("kaydedildi");
      } catch {
        setStatus("kaydedilmedi");
      }
    },
    [note, onSave, ttlHours]
  );

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setStatus("kaydedilmedi");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      triggerSave(val, body);
    }, 600);
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    setStatus("kaydedilmedi");
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
      <div className="flex-1 flex items-center justify-center bg-black text-zinc-700 font-mono text-xs select-none">
        bir not seç veya yeni oluştur
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

  return (
    <div className="flex-1 flex flex-col h-full bg-black font-mono text-xs text-zinc-300">
      {/* Top minimal status & actions */}
      <div className="px-5 py-2 border-b border-zinc-900 flex items-center justify-between text-[11px] text-zinc-600 select-none">
        <div className="flex items-center gap-3">
          <span className={status === "..." ? "text-zinc-400" : status === "kaydedilmedi" ? "text-amber-500" : "text-zinc-600"}>
            [{status}]
          </span>
          <button
            onClick={handleTtlCycle}
            title="Süreyi değiştir (2s, 4s, 6s, 8s, 12s, 24s)"
            className="hover:text-zinc-300 transition text-zinc-400"
          >
            [imha: {ttlHours}s]
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => exportNoteAsTxt(note)}
            title="Notu IP ve cihaz bilgileriyle .txt indir"
            className="hover:text-zinc-200 transition"
          >
            [txt]
          </button>
          <button
            type="button"
            onClick={() => exportNoteAsZip(note)}
            title="Notu ve adli iz meta dosyasını .zip indir"
            className="hover:text-zinc-200 transition"
          >
            [zip]
          </button>
          <button
            type="button"
            onClick={() => onTogglePin(note)}
            className="hover:text-zinc-300 transition"
          >
            {note.isPinned ? "[sabiti kaldır]" : "[sabitle]"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Bu notu silmek istiyor musunuz?")) onDelete(note.id);
            }}
            className="hover:text-red-400 transition"
          >
            [sil]
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex flex-col px-5 py-4 max-w-4xl w-full mx-auto overflow-hidden">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="başlık..."
          className="w-full bg-transparent text-sm font-bold text-zinc-100 placeholder-zinc-800 focus:outline-none mb-3 pb-1 border-b border-zinc-900 focus:border-zinc-700"
        />

        <textarea
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder="not içeriği..."
          className="flex-1 w-full bg-transparent resize-none text-zinc-300 placeholder-zinc-800 focus:outline-none leading-relaxed font-mono text-xs"
        />
      </div>

      {/* Bottom Adli İz / IP & Cihaz Bilgi Barı */}
      <div className="px-5 py-1.5 border-t border-zinc-900 text-[10px] text-zinc-600 flex items-center justify-between select-none">
        <div className="truncate max-w-md">
          <span>ip: {note.createdIp || "127.0.0.1"}</span>
          <span className="mx-2 text-zinc-800">•</span>
          <span className="truncate" title={note.userAgent || ""}>
            cihaz: {note.userAgent ? note.userAgent.slice(0, 35) + "..." : "bilinmiyor"}
          </span>
        </div>
        <div>
          <span>imha saati: {formatShortTime(note.expiresAt)}</span>
        </div>
      </div>
    </div>
  );
}
