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

  // Dil tercihini yükle
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

  // Oturum kontrolü
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

  // Notları çek
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

  // Yeni Not Oluştur
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

  // Not Güncelle
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

  // Not Sil
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

  // Sabitle / Sabitlemeyi Kaldır
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

  // Çıkış
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setNotes([]);
    setActiveNoteId(null);
    setShowAdminModal(false);
  };

  // Kısayol: Ctrl+N
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
      <div className="flex h-screen items-center justify-center bg-black text-zinc-700 font-mono text-xs">
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black text-zinc-300 font-mono text-xs">
      {/* Top Header */}
      <header className="h-8 border-b border-zinc-900 px-4 flex items-center justify-between bg-black select-none text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-widest">{t.appName}</span>
          <span className="text-zinc-700">/</span>
          <div className="flex gap-1 text-[10px]">
            {languages.map((l) => (
              <button
                key={l}
                onClick={() => handleLanguageChange(l)}
                className={`px-1 uppercase transition ${
                  lang === l ? "text-white font-bold underline" : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-400">@{user.username}</span>
          {user.role === "ADMIN" && (
            <button
              onClick={() => setShowAdminModal(true)}
              className="text-amber-400 border border-amber-800/80 bg-amber-950/30 px-1.5 py-0.2 hover:bg-amber-900/40 transition text-[10px]"
            >
              [{t.adminPanel}]
            </button>
          )}
          <button
            onClick={handleLogout}
            className="text-zinc-600 hover:text-red-400 transition"
          >
            [{t.logout}]
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
