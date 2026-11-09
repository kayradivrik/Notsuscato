"use client";

import { DecryptedNote } from "@/lib/export";
import { Language, translations } from "@/lib/i18n";

interface NoteListProps {
  lang: Language;
  notes: DecryptedNote[];
  activeNoteId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectNote: (note: DecryptedNote) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (note: DecryptedNote) => void;
}

export function NoteList({
  lang,
  notes,
  activeNoteId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
}: NoteListProps) {
  const t = translations[lang];

  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.body && n.body.toLowerCase().includes(q))
    );
  });

  const getRemainingTime = (expiresAt?: string) => {
    if (!expiresAt) return "";
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "0h";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  return (
    <aside className="w-64 border-r border-zinc-200/80 bg-[#fbfbfb] flex flex-col h-full text-xs select-none shrink-0">
      {/* Top search & create */}
      <div className="p-3 border-b border-zinc-200/80 flex items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 text-xs transition"
        />
        <button
          onClick={onCreateNote}
          className="bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white font-medium px-3 py-1.5 rounded-xl shadow-2xs transition-all duration-150 cursor-pointer text-xs shrink-0"
        >
          {t.newNote}
        </button>
      </div>

      {/* Note items list */}
      <div className="flex-1 overflow-y-auto py-1.5 space-y-1">
        {filteredNotes.length === 0 ? (
          <div className="p-6 text-center text-zinc-400 text-xs">
            {searchQuery ? t.noResults : t.noNotes}
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isActive = note.id === activeNoteId;
            const remaining = getRemainingTime(note.expiresAt);

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`group mx-2 px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-1.5 transition ${
                  isActive
                    ? "bg-white border border-zinc-300 shadow-2xs text-zinc-950 font-medium"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <div className="truncate flex-1">
                  <span className="truncate block">
                    {note.isPinned && <span className="text-zinc-900 font-bold mr-1">•</span>}
                    {note.title.trim() || t.untitled}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                  {remaining && (
                    <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 px-1.5 py-0.5 rounded-md font-mono font-medium">
                      {remaining}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(note);
                    }}
                    title={note.isPinned ? t.unpin : t.pin}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-900 transition"
                  >
                    {note.isPinned ? "★" : "☆"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(t.confirmDelete)) onDeleteNote(note.id);
                    }}
                    title={t.delete}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600 transition font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
