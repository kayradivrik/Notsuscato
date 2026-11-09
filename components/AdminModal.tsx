"use client";

import { useState, useEffect } from "react";
import { Language, translations } from "@/lib/i18n";

interface AdminNote {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  createdIp?: string;
  userAgent?: string;
  createdAt: string;
  expiresAt?: string;
  author: string;
  userId: string;
}

interface AdminUser {
  id: string;
  username: string;
  role: string;
  lastIp?: string;
  userAgent?: string;
  createdAt: string;
  noteCount: number;
}

interface AdminModalProps {
  lang: Language;
  onClose: () => void;
}

export function AdminModal({ lang, onClose }: AdminModalProps) {
  const t = translations[lang];
  const [tab, setTab] = useState<"notes" | "users">("notes");
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin");
      if (!res.ok) throw new Error("Yetkisiz erişim");
      const data = await res.json();
      setNotes(data.notes || []);
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteNote = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      const res = await fetch(`/api/admin?type=note&id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm(t.deleteUserConfirm)) return;
    try {
      const res = await fetch(`/api/admin?type=user&id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setNotes((prev) => prev.filter((n) => n.userId !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase()) ||
      n.author.toLowerCase().includes(search.toLowerCase()) ||
      (n.createdIp && n.createdIp.includes(search))
  );

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.lastIp && u.lastIp.includes(search))
  );

  const formatTime = (iso?: string) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString("tr-TR")} ${d.toLocaleTimeString("tr-TR")}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-zinc-300 font-mono text-xs">
      {/* Top Header */}
      <div className="h-10 border-b border-zinc-800 px-4 flex items-center justify-between select-none bg-zinc-950">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white tracking-wider">
            {t.adminPanel.toUpperCase()}
          </span>
          <span className="text-zinc-700">|</span>
          <button
            onClick={() => setTab("notes")}
            className={`transition ${tab === "notes" ? "text-white underline font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {t.allNotes} ({notes.length})
          </button>
          <span className="text-zinc-700">/</span>
          <button
            onClick={() => setTab("users")}
            className={`transition ${tab === "users" ? "text-white underline font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {t.allUsers} ({users.length})
          </button>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t.searchPlaceholder}`}
            className="bg-black border border-zinc-800 px-2 py-0.5 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 text-[11px] w-48"
          />
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-red-400 transition"
          >
            [{t.close}]
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 max-w-6xl w-full mx-auto">
        {loading ? (
          <div className="p-8 text-center text-zinc-600">{t.saving}</div>
        ) : tab === "notes" ? (
          filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-zinc-600">{t.emptyAdmin}</div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((n) => (
                <div
                  key={n.id}
                  className="border border-zinc-900 bg-zinc-950/70 p-3 space-y-2 hover:border-zinc-800 transition"
                >
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-100">{n.title || t.untitled}</span>
                      <span className="text-zinc-600">by</span>
                      <span className="text-zinc-400">@{n.author}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-600">{formatTime(n.createdAt)}</span>
                      <button
                        onClick={() => handleDeleteNote(n.id)}
                        className="text-red-500 hover:text-red-400 transition"
                      >
                        [{t.delete}]
                      </button>
                    </div>
                  </div>

                  <div className="text-zinc-300 text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto py-1">
                    {n.body || "(boş içerik)"}
                  </div>

                  <div className="border-t border-zinc-900/80 pt-1.5 text-[10px] text-zinc-600 flex items-center justify-between">
                    <div>
                      <span>IP: {n.createdIp || "127.0.0.1"}</span>
                      <span className="mx-2 text-zinc-800">•</span>
                      <span>Cihaz: {n.userAgent || "bilinmiyor"}</span>
                    </div>
                    <div>
                      <span>{t.expiresAt}: {formatTime(n.expiresAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-zinc-600">{t.emptyAdmin}</div>
        ) : (
          <div className="border border-zinc-900 divide-y divide-zinc-900">
            <div className="grid grid-cols-12 p-2.5 font-bold text-zinc-500 text-[11px] bg-zinc-950">
              <span className="col-span-3">{t.username}</span>
              <span className="col-span-2">Rol</span>
              <span className="col-span-2">{t.userNotesCount}</span>
              <span className="col-span-3">Son IP / Kayıt</span>
              <span className="col-span-2 text-right">{t.actions}</span>
            </div>
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-12 p-2.5 text-zinc-300 text-[11px] hover:bg-zinc-950/60 items-center transition"
              >
                <span className="col-span-3 font-semibold text-zinc-100">@{u.username}</span>
                <span className="col-span-2">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] border ${
                      u.role === "ADMIN"
                        ? "border-amber-700/60 text-amber-400 bg-amber-950/20"
                        : "border-zinc-800 text-zinc-500"
                    }`}
                  >
                    {u.role}
                  </span>
                </span>
                <span className="col-span-2 text-zinc-400">{u.noteCount} not</span>
                <div className="col-span-3 text-[10px] text-zinc-500">
                  <div>{u.lastIp || "127.0.0.1"}</div>
                  <div>{formatTime(u.createdAt)}</div>
                </div>
                <div className="col-span-2 text-right">
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="text-red-500 hover:text-red-400 transition"
                  >
                    [{t.delete}]
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
