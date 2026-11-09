"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthModal } from "@/components/AuthModal";
import { NoteList } from "@/components/NoteList";
import { NoteEditor } from "@/components/NoteEditor";
import { AdminModal } from "@/components/AdminModal";
import { ProfilePage } from "@/components/ProfilePage";
import { UserProfile } from "@/components/ProfileModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { DecryptedNote } from "@/lib/export";
import { Language, translations } from "@/lib/i18n";

export default function Home() {
  const [lang, setLang] = useState<Language>("tr");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<DecryptedNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [currentView, setCurrentView] = useState<"notes" | "profile">("notes");
  const [noteToDelete, setNoteToDelete] = useState<DecryptedNote | null>(null);

  const t = translations[lang];
  const languages: Language[] = ["tr", "en", "de", "ru"];

  useEffect(() => {
    const saved = localStorage.getItem("notsuscato_lang") as Language;
    if (saved && ["tr", "en", "de", "ru"].includes(saved)) {
      setLang(saved);
    }
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("notsuscato_lang", newLang);
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Auth check hatası:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/notes");
      if (!res.ok) return;

      const data = await res.json();
      const loadedNotes: DecryptedNote[] = data.notes || [];

      setNotes(loadedNotes);
      if (loadedNotes.length > 0 && !activeNoteId) {
        setActiveNoteId(loadedNotes[0].id);
      }
    } catch (err) {
      console.error("Not yükleme hatası:", err);
    }
  }, [activeNoteId]);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user, fetchNotes]);

  const handleCreateNote = async (initialHours: number = 24) => {
    try {
      const defaultTitle = t.untitled;
      const defaultBody = "";

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: defaultTitle,
          body: defaultBody,
          isPinned: false,
          expiresInHours: initialHours,
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      const createdNote: DecryptedNote = data.note;

      setNotes((prev) => [createdNote, ...prev]);
      setActiveNoteId(createdNote.id);
    } catch (err) {
      console.error("Oluşturma hatası:", err);
    }
  };

  const handleSaveNote = async (
    id: string,
    newTitle: string,
    newBody: string,
    isPinned: boolean,
    expiresInHours?: number
  ) => {
    const payload: Record<string, unknown> = {
      title: newTitle,
      body: newBody,
      isPinned,
    };
    if (expiresInHours) payload.expiresInHours = expiresInHours;

    const res = await fetch(`/api/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Kaydedilemedi");

    const data = await res.json();
    const updatedRecord = data.note;
    const now = new Date().toISOString();

    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              title: newTitle,
              body: newBody,
              updatedAt: now,
              expiresAt: updatedRecord?.expiresAt || n.expiresAt,
            }
          : n
      )
    );
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) return;

      setNotes((prev) => {
        const remaining = prev.filter((n) => n.id !== id);
        if (activeNoteId === id) {
          setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
        }
        return remaining;
      });
    } catch (err) {
      console.error("Silme hatası:", err);
    }
  };

  const handleTogglePin = async (note: DecryptedNote) => {
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });

      if (!res.ok) return;

      setNotes((prev) =>
        [...prev]
          .map((n) => (n.id === note.id ? { ...n, isPinned: !note.isPinned } : n))
          .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
      );
    } catch (err) {
      console.error("Sabitleme hatası:", err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setNotes([]);
    setActiveNoteId(null);
    setShowAdminModal(false);
  };

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handleCreateNote(24);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [user]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa] text-zinc-400 text-sm">
        {t.saving}
      </div>
    );
  }

  if (!user) {
    return (
      <AuthModal
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onSuccess={(loggedUser) => setUser(loggedUser)}
      />
    );
  }

  if (currentView === "profile") {
    return (
      <ProfilePage
        user={user}
        lang={lang}
        onBack={() => setCurrentView("notes")}
        onUpdateUser={(updated) =>
          setUser((prev) => (prev ? { ...prev, ...updated } : null))
        }
        onLogout={handleLogout}
      />
    );
  }

  const theme = user.theme || "clean";
  const isDark = theme === "dark";
  const isSepia = theme === "sepia";

  const wrapperBg = isDark
    ? "bg-[#09090b] text-zinc-100"
    : isSepia
    ? "bg-[#fcf8ed] text-[#3e382d]"
    : "bg-[#fafafa] text-zinc-900";

  const headerBg = isDark
    ? "bg-[#111114] border-zinc-800 text-zinc-100 shadow-none"
    : isSepia
    ? "bg-[#f8f3e6] border-[#e2d8c3] text-[#3e382d] shadow-none"
    : "bg-white border-zinc-200/80 text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)]";

  const langContainerBg = isDark ? "bg-zinc-800/80" : isSepia ? "bg-[#efe7d5]" : "bg-zinc-100";
  const langActiveBg = isDark
    ? "bg-zinc-700 text-white"
    : isSepia
    ? "bg-white text-[#2e2920]"
    : "bg-white text-zinc-900 shadow-2xs";

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden transition-colors ${wrapperBg}`}>
      {/* Top Header */}
      <header className={`h-13 border-b px-6 flex items-center justify-between select-none transition-colors ${headerBg}`}>
        <div className="flex items-center gap-4">
          <div
            onClick={() => setActiveNoteId(null)}
            className="flex items-center cursor-pointer group py-1"
            title="notsuscato"
          >
            <span className={`font-bold text-base tracking-tight transition-colors ${isDark ? "text-white group-hover:text-zinc-400" : "text-zinc-900 group-hover:text-zinc-600"}`}>
              notsuscato<span className="text-zinc-400 group-hover:text-zinc-900 inline-block transition-colors">.</span>
            </span>
          </div>

          <div className={`flex gap-1 p-0.5 rounded-lg text-[10px] ${langContainerBg}`}>
            {languages.map((l) => (
              <button
                key={l}
                onClick={() => handleLanguageChange(l)}
                className={`px-2 py-0.5 rounded-md uppercase font-semibold transition cursor-pointer ${
                  lang === l
                    ? langActiveBg
                    : isDark
                    ? "text-zinc-400 hover:text-zinc-200"
                    : isSepia
                    ? "text-[#6b6251] hover:text-[#2e2920]"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${isDark ? "text-zinc-400" : isSepia ? "text-[#6b6251]" : "text-zinc-600"}`}>
            @{user.username}
          </span>

          {user.role === "ADMIN" && (
            <button
              onClick={() => setShowAdminModal(true)}
              className={`border font-medium px-2.5 py-1 rounded-xl text-xs active:scale-[0.98] transition-all duration-150 cursor-pointer ${
                isDark
                  ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200"
                  : isSepia
                  ? "bg-[#efe7d5] hover:bg-[#e4dac0] border-[#dfd2b5] text-[#4d4434]"
                  : "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800"
              }`}
            >
              {t.adminPanel}
            </button>
          )}

          <button
            onClick={handleLogout}
            className={`px-2.5 py-1 rounded-xl text-xs active:scale-[0.98] transition-all duration-150 cursor-pointer ${
              isDark
                ? "text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60"
                : "text-zinc-500 hover:text-red-600 hover:bg-zinc-50"
            }`}
          >
            {t.logout}
          </button>

          {/* Profile Circle Avatar / SVG Button */}
          <button
            type="button"
            onClick={() => setCurrentView("profile")}
            title={t.manageProfile}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center border border-zinc-700/80 shadow-2xs active:scale-95 transition-all duration-150 cursor-pointer overflow-hidden group shrink-0"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden min-w-0">
        <NoteList
          lang={lang}
          notes={notes}
          activeNoteId={activeNoteId}
          searchQuery={searchQuery}
          theme={theme}
          onSearchChange={setSearchQuery}
          onSelectNote={(note) => setActiveNoteId(note.id)}
          onCreateNote={() => handleCreateNote(24)}
          onRequestDelete={(note) => setNoteToDelete(note)}
          onTogglePin={handleTogglePin}
        />
        <NoteEditor
          lang={lang}
          note={activeNote}
          theme={theme}
          onSave={handleSaveNote}
          onRequestDelete={(note) => setNoteToDelete(note)}
          onTogglePin={handleTogglePin}
        />
      </main>

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!noteToDelete}
        lang={lang}
        title={t.deleteNoteConfirmTitle}
        description={t.deleteNoteConfirmDesc}
        confirmText={t.deleteConfirmBtn}
        cancelText={t.cancelBtn}
        onConfirm={() => {
          if (noteToDelete) handleDeleteNote(noteToDelete.id);
          setNoteToDelete(null);
        }}
        onCancel={() => setNoteToDelete(null)}
      />

      {/* Admin Panel Overlay */}
      {showAdminModal && (
        <AdminModal lang={lang} onClose={() => setShowAdminModal(false)} />
      )}
    </div>
  );
}
