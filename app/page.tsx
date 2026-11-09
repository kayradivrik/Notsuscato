"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthModal } from "@/components/AuthModal";
import { NoteList } from "@/components/NoteList";
import { NoteEditor } from "@/components/NoteEditor";
import { DecryptedNote } from "@/lib/export";
import {
  encryptText,
  decryptText,
  deriveEncryptionKey,
} from "@/lib/crypto";

interface UserProfile {
  id: string;
  username: string;
  clientSalt?: string;
}

interface EncryptedNoteRecord {
  id: string;
  titleCiphertext: string;
  bodyCiphertext: string;
  iv: string;
  isPinned: boolean;
  createdIp?: string;
  userAgent?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [notes, setNotes] = useState<DecryptedNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsUnlock, setNeedsUnlock] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          const cachedPass = sessionStorage.getItem("vault_pass_temp");
          if (cachedPass && data.user.clientSalt) {
            try {
              const key = await deriveEncryptionKey(cachedPass, data.user.clientSalt);
              setCryptoKey(key);
            } catch {
              setNeedsUnlock(true);
            }
          } else {
            setNeedsUnlock(true);
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

  const fetchAndDecryptNotes = useCallback(async (key: CryptoKey) => {
    try {
      const res = await fetch("/api/notes");
      if (!res.ok) return;

      const data = await res.json();
      const rawNotes: EncryptedNoteRecord[] = data.notes || [];

      const decrypted: DecryptedNote[] = await Promise.all(
        rawNotes.map(async (n) => {
          let title = "";
          let body = "";
          try {
            title = await decryptText(n.titleCiphertext, n.iv, key);
            body = await decryptText(n.bodyCiphertext, n.iv, key);
          } catch {
            title = "[şifre çözülemedi]";
            body = "";
          }

          return {
            id: n.id,
            title,
            body,
            iv: n.iv,
            isPinned: n.isPinned,
            createdIp: n.createdIp,
            userAgent: n.userAgent,
            expiresAt: n.expiresAt,
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
          };
        })
      );

      setNotes(decrypted);
      if (decrypted.length > 0 && !activeNoteId) {
        setActiveNoteId(decrypted[0].id);
      }
    } catch (err) {
      console.error("Not yükleme hatası:", err);
    }
  }, [activeNoteId]);

  useEffect(() => {
    if (cryptoKey) {
      fetchAndDecryptNotes(cryptoKey);
    }
  }, [cryptoKey, fetchAndDecryptNotes]);

  const handleCreateNote = async (initialHours: number = 24) => {
    if (!cryptoKey) return;

    try {
      const defaultTitle = "isimsiz";
      const defaultBody = "";
      const { ciphertext: titleCiphertext, iv } = await encryptText(defaultTitle, cryptoKey);
      const { ciphertext: bodyCiphertext } = await encryptText(defaultBody, cryptoKey);

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleCiphertext,
          bodyCiphertext,
          iv,
          isPinned: false,
          expiresInHours: initialHours,
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      const createdNote: DecryptedNote = {
        id: data.note.id,
        title: defaultTitle,
        body: defaultBody,
        iv: data.note.iv,
        isPinned: data.note.isPinned,
        createdIp: data.note.createdIp,
        userAgent: data.note.userAgent,
        expiresAt: data.note.expiresAt,
        createdAt: data.note.createdAt,
        updatedAt: data.note.updatedAt,
      };

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
    if (!cryptoKey) return;

    const { ciphertext: titleCiphertext, iv } = await encryptText(newTitle, cryptoKey);
    const { ciphertext: bodyCiphertext } = await encryptText(newBody, cryptoKey);

    const payload: Record<string, unknown> = {
      titleCiphertext,
      bodyCiphertext,
      iv,
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

  const handleLockVault = () => {
    sessionStorage.removeItem("vault_pass_temp");
    setCryptoKey(null);
    setNotes([]);
    setActiveNoteId(null);
    setNeedsUnlock(true);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("vault_pass_temp");
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setCryptoKey(null);
    setNotes([]);
    setActiveNoteId(null);
    setNeedsUnlock(false);
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
  }, [cryptoKey]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-zinc-700 font-mono text-xs">
        yükleniyor...
      </div>
    );
  }

  if (!user || (!cryptoKey && needsUnlock)) {
    return (
      <AuthModal
        unlockOnly={
          needsUnlock && user && user.clientSalt
            ? { username: user.username, clientSalt: user.clientSalt }
            : undefined
        }
        onSuccess={(loggedUser, key) => {
          if (loggedUser.id) setUser(loggedUser);
          setCryptoKey(key);
          setNeedsUnlock(false);
        }}
        onCancelUnlock={handleLogout}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black text-zinc-300 font-mono text-xs">
      {/* Top Header */}
      <header className="h-8 border-b border-zinc-900 px-4 flex items-center justify-between bg-black select-none text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-100 tracking-wider">NOTLAR</span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-500">süreli e2ee</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-500">@{user.username}</span>
          <button
            onClick={handleLockVault}
            className="text-zinc-500 hover:text-zinc-300 transition"
          >
            [kilitle]
          </button>
          <button
            onClick={handleLogout}
            className="text-zinc-600 hover:text-red-400 transition"
          >
            [çıkış]
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        <NoteList
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
          note={activeNote}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
          onTogglePin={handleTogglePin}
        />
      </main>
    </div>
  );
}
