"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthModal } from "@/components/AuthModal";
import { NoteList } from "@/components/NoteList";
import { NoteEditor } from "@/components/NoteEditor";
import { AdminModal } from "@/components/AdminModal";
import { DecryptedNote } from "@/lib/export";
import { Language, translations } from "@/lib/i18n";

interface UserProfile {
  id: string;
  username: string;
  role: string;
}

export default function Home() {
  const [lang, setLang] = useState<Language>("tr");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<DecryptedNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);

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
      <div className="flex h-screen items-center justify-center bg-[#fbfbfd] text-zinc-400 text-sm">
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

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#fcfcfd] text-zinc-800">
      {/* Top Header */}
      <header className="h-12 border-b border-zinc-200/90 px-5 flex items-center justify-between bg-white select-none shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-orange-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              N
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-900">
              {t.appName}
            </span>
          </div>

          <div className="flex gap-1 bg-zinc-100 p-0.5 rounded-md text-[10px]">
            {languages.map((l) => (
              <button
                key={l}
                onClick={() => handleLanguageChange(l)}
                className={`px-1.5 py-0.5 rounded uppercase font-semibold transition cursor-pointer ${
                  lang === l
                    ? "bg-white text-orange-600 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600 font-medium">@{user.username}</span>

          {user.role === "ADMIN" && (
            <button
              onClick={() => setShowAdminModal(true)}
              className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-semibold px-2.5 py-1 rounded-lg text-xs transition cursor-pointer"
            >
              {t.adminPanel}
            </button>
          )}

          <button
            onClick={handleLogout}
            className="text-zinc-500 hover:text-red-600 hover:bg-zinc-100 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer"
          >
            {t.logout}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        <NoteList
          lang={lang}
          notes={notes}
          activeNoteId={activeNoteId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectNote={(note) => setActiveNoteId(note.id)}
          onCreateNote={() => handleCreateNote(24)}
          onDeleteNote={handleDeleteNote}
          onTogglePin={handleTogglePin}
        />
        <NoteEditor
          lang={lang}
          note={activeNote}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
          onTogglePin={handleTogglePin}
        />
      </main>

      {/* Admin Panel Overlay */}
      {showAdminModal && (
        <AdminModal lang={lang} onClose={() => setShowAdminModal(false)} />
      )}
    </div>
  );
}
