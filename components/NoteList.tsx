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
      <div className={`p-2.5 sm:p-3 border-b flex items-center gap-2 ${isDark ? "border-zinc-800" : isSepia ? "border-[#e2d8c3]" : "border-zinc-200/80"}`}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className={`flex-1 min-w-0 border rounded-xl px-3 py-2 text-base sm:text-xs focus:outline-none focus:ring-2 transition ${searchInputStyle}`}
        />
        <button
          onClick={onCreateNote}
          className={`${createBtnStyle} active:scale-[0.98] font-medium px-3.5 py-2 rounded-xl shadow-2xs transition-all duration-150 cursor-pointer text-xs shrink-0 whitespace-nowrap flex items-center gap-1.5`}
        >
          <span className="text-sm leading-none font-bold">+</span>
          <span>{t.newNote}</span>
        </button>
      </div>

      {/* Note items list */}
      <div className="flex-1 overflow-y-auto py-2 space-y-1.5 px-2">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs">
            {searchQuery ? t.noResults : t.noNotes}
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isActive = note.id === activeNoteId;
            const remaining = getRemainingTime(note.expiresAt);
            const previewText = note.body ? note.body.replace(/\n+/g, " ").trim() : "";

            const itemActiveStyle = isActive
              ? isDark
                ? "bg-zinc-900 border-zinc-700 text-white shadow-xs"
                : isSepia
                ? "bg-white border-[#dfd3ba] text-[#2e2920] shadow-xs"
                : "bg-white border-zinc-300 shadow-xs text-zinc-950"
              : isDark
              ? "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border-transparent"
              : isSepia
              ? "text-[#59503e] hover:bg-[#efe7d5] hover:text-[#2e2920] border-transparent"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border-transparent";

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`group px-3 py-2.5 sm:py-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2.5 border transition active:scale-[0.99] ${itemActiveStyle}`}
              >
                <div className="truncate flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    {note.isPinned && (
                      <span className="text-amber-500 shrink-0 font-bold text-xs" title={t.pin}>
                        ★
                      </span>
                    )}
                    <span className="truncate font-semibold text-xs">
                      {note.title.trim() || t.untitled}
                    </span>
                  </div>
                  {previewText && (
                    <p className={`text-[11px] truncate mt-0.5 font-normal ${
                      isActive 
                        ? isDark ? "text-zinc-400" : isSepia ? "text-[#6b6251]" : "text-zinc-500"
                        : "text-zinc-400"
                    }`}>
                      {previewText}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 text-[10px]">
                  {remaining && (
                    <span className={`px-1.5 py-0.5 rounded-md font-mono font-medium text-[10px] shrink-0 ${
                      isDark
                        ? "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
                        : isSepia
                        ? "bg-[#efe7d5] text-[#59503e] border border-[#dfd3ba]"
                        : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                    }`}>
                      {remaining}
                    </span>
                  )}

                  {/* Pin toggle: always accessible on touch (opacity-100 on mobile, hover on desktop) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(note);
                    }}
                    title={note.isPinned ? t.unpin : t.pin}
                    className={`p-1.5 rounded-lg active:scale-90 transition-all cursor-pointer ${
                      note.isPinned
                        ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 opacity-100"
                        : "opacity-60 sm:opacity-0 sm:group-hover:opacity-100 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
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

                  {/* Delete button: accessible on touch (opacity-60 on mobile, hover on desktop) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDelete(note);
                    }}
                    title={t.delete}
                    className="p-1.5 rounded-lg opacity-60 sm:opacity-0 sm:group-hover:opacity-100 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-90 transition-all cursor-pointer"
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
