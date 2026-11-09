"use client";

import { DecryptedNote } from "@/lib/export";
import { Language, translations } from "@/lib/i18n";

interface NoteListProps {
  lang: Language;
  notes: DecryptedNote[];
  activeNoteId: string | null;
  searchQuery: string;
  theme?: string;
  onSearchChange: (q: string) => void;
  onSelectNote: (note: DecryptedNote) => void;
  onCreateNote: () => void;
  onRequestDelete: (note: DecryptedNote) => void;
  onTogglePin: (note: DecryptedNote) => void;
}

export function NoteList({
  lang,
  notes,
  activeNoteId,
  searchQuery,
  theme = "clean",
  onSearchChange,
  onSelectNote,
  onCreateNote,
  onRequestDelete,
  onTogglePin,
}: NoteListProps) {
  const t = translations[lang];
  const isDark = theme === "dark";
  const isSepia = theme === "sepia";

  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.body && n.body.toLowerCase().includes(q))
    );
  });

  const getRemainingTime = (expiresAt?: string) => {
    if (!expiresAt) return t.permanent;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "0h";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const asideBg = isDark
    ? "border-r border-zinc-800 bg-[#0e0e11] text-zinc-300"
    : isSepia
    ? "border-r border-[#e2d8c3] bg-[#f8f3e6] text-[#3e382d]"
    : "border-r border-zinc-200/80 bg-[#fbfbfb] text-zinc-800";

  const searchInputStyle = isDark
    ? "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 focus:ring-zinc-700/20"
    : isSepia
    ? "bg-[#fffdf9] border-[#dfd3ba] text-[#2e2920] placeholder-[#b3a895] focus:border-[#a69c89]"
    : "bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:ring-zinc-900/5";

  const createBtnStyle = isDark
    ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
    : isSepia
    ? "bg-[#3e382d] hover:bg-[#2e2920] text-[#fbf8ed]"
    : "bg-zinc-900 hover:bg-zinc-800 text-white";

  return (
    <aside className={`w-full md:w-72 md:shrink-0 flex flex-col h-full text-xs select-none overflow-hidden transition-colors ${asideBg}`}>
      {/* Top search & create */}
      <div className={`p-3 border-b flex items-center gap-2 ${isDark ? "border-zinc-800" : isSepia ? "border-[#e2d8c3]" : "border-zinc-200/80"}`}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className={`flex-1 min-w-0 border rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 text-xs transition ${searchInputStyle}`}
        />
        <button
          onClick={onCreateNote}
          className={`${createBtnStyle} active:scale-[0.98] font-medium px-3 py-1.5 rounded-xl shadow-2xs transition-all duration-150 cursor-pointer text-xs shrink-0 whitespace-nowrap`}
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

            const itemActiveStyle = isActive
              ? isDark
                ? "bg-zinc-900/90 border border-zinc-700 text-white shadow-2xs font-medium"
                : isSepia
                ? "bg-white border border-[#dfd3ba] text-[#2e2920] shadow-2xs font-medium"
                : "bg-white border border-zinc-300 shadow-2xs text-zinc-950 font-medium"
              : isDark
              ? "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent"
              : isSepia
              ? "text-[#59503e] hover:bg-[#efe7d5] hover:text-[#2e2920] border border-transparent"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent";

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`group mx-2 px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-1.5 transition ${itemActiveStyle}`}
              >
                <div className="truncate flex-1 min-w-0">
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
                    className={`p-1 rounded-md active:scale-90 transition-all cursor-pointer ${
                      note.isPinned
                        ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 opacity-100"
                        : "opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60"
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
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDelete(note);
                    }}
                    title={t.delete}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all cursor-pointer"
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
