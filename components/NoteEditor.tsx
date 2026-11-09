"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DecryptedNote } from "./NoteList";

interface NoteEditorProps {
  note: DecryptedNote | null;
  onSave: (id: string, title: string, body: string, isPinned: boolean) => Promise<void>;
  onDelete: (id: string) => void;
  onTogglePin: (note: DecryptedNote) => void;
}

export function NoteEditor({
  note,
  onSave,
  onDelete,
  onTogglePin,
}: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"kaydedildi" | "kaydediliyor..." | "kaydedilmedi">("kaydedildi");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBody(note.body);
      setStatus("kaydedildi");
    } else {
      setTitle("");
      setBody("");
      setStatus("kaydedildi");
    }
  }, [note?.id]);

  const triggerSave = useCallback(
    async (newTitle: string, newBody: string) => {
      if (!note) return;
      setStatus("kaydediliyor...");
      try {
        await onSave(note.id, newTitle, newBody, note.isPinned);
        setStatus("kaydedildi");
      } catch {
        setStatus("kaydedilmedi");
      }
    },
    [note, onSave]
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

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charCount = body.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-black font-mono text-xs text-zinc-300">
      {/* Minimal Top Bar */}
      <div className="px-6 py-2 border-b border-zinc-900 flex items-center justify-between text-[11px] text-zinc-600 select-none">
        <div className="flex items-center gap-3">
          <span className={status === "kaydediliyor..." ? "text-zinc-400" : status === "kaydedilmedi" ? "text-amber-500" : "text-zinc-600"}>
            [{status}]
          </span>
          <span>{wordCount} kelime</span>
          <span>{charCount} karakter</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onTogglePin(note)}
            className="hover:text-zinc-300 transition"
          >
            {note.isPinned ? "[sabitlemeyi kaldır]" : "[başa sabitle]"}
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
      <div className="flex-1 flex flex-col p-6 max-w-4xl w-full mx-auto overflow-hidden">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="başlık..."
          className="w-full bg-transparent text-base font-bold text-zinc-100 placeholder-zinc-800 focus:outline-none mb-3 pb-1 border-b border-zinc-900 focus:border-zinc-700"
        />

        <textarea
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder="not içeriği..."
          className="flex-1 w-full bg-transparent resize-none text-zinc-300 placeholder-zinc-800 focus:outline-none leading-relaxed font-mono"
        />
      </div>
    </div>
  );
}
