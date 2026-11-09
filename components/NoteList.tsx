"use client";

import { DecryptedNote } from "@/lib/export";

interface NoteListProps {
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
  notes,
  activeNoteId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
}: NoteListProps) {
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
    if (diff <= 0) return "süresi doldu";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}s`;
    return `${mins}dk`;
  };

  return (
    <aside className="w-56 border-r border-zinc-900 bg-black flex flex-col h-full font-mono text-xs select-none shrink-0">
      {/* Top search & create */}
      <div className="p-2.5 border-b border-zinc-900 flex items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ara..."
          className="flex-1 bg-transparent border-b border-zinc-800 text-zinc-300 placeholder-zinc-700 pb-0.5 focus:outline-none focus:border-zinc-500 text-[11px]"
        />
        <button
          onClick={onCreateNote}
          className="text-zinc-400 hover:text-white transition text-[11px]"
        >
          [+yeni]
        </button>
      </div>

      {/* Note items */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/40">
        {filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-zinc-700 text-[11px]">
            {searchQuery ? "bulunamadı" : "not yok"}
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isActive = note.id === activeNoteId;
            const remaining = getRemainingTime(note.expiresAt);

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`group px-2.5 py-2 cursor-pointer flex items-center justify-between gap-1 transition ${
                  isActive
                    ? "bg-zinc-900 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-950 hover:text-zinc-200"
                }`}
              >
                <div className="truncate flex-1">
                  <span className="truncate">
                    {note.isPinned && <span className="text-zinc-500 mr-1">*</span>}
                    {note.title.trim() || "isimsiz"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                  {remaining && (
                    <span className="text-zinc-600 font-mono" title={`İmha: ${note.expiresAt}`}>
                      {remaining}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(note);
                    }}
                    title={note.isPinned ? "sabiti kaldır" : "sabitle"}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-300 transition"
                  >
                    {note.isPinned ? "[s]" : "[p]"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Silinsin mi?")) onDeleteNote(note.id);
                    }}
                    title="sil"
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition"
                  >
                    [x]
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
