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

  const filteredUsers = users.filter(
    (u) =>
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
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/40 backdrop-blur-xs p-4 sm:p-8">
      <div className="flex-1 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden max-w-6xl w-full mx-auto">
        {/* Top Header */}
        <div className="h-14 border-b border-slate-200/80 px-6 flex items-center justify-between select-none bg-slate-50/70">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span className="font-bold text-slate-900 text-sm tracking-tight">
                {t.adminPanel}
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl text-xs">
              <button
                onClick={() => setTab("notes")}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  tab === "notes"
                    ? "bg-white text-indigo-600 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.allNotes} ({notes.length})
              </button>
              <button
                onClick={() => setTab("users")}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  tab === "users"
                    ? "bg-white text-indigo-600 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.allUsers} ({users.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-xs w-52"
            />
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">{t.saving}</div>
          ) : tab === "notes" ? (
            filteredNotes.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">{t.emptyAdmin}</div>
            ) : (
              <div className="space-y-4">
                {filteredNotes.map((n) => (
                  <div
                    key={n.id}
                    className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-slate-50/40 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {n.title || t.untitled}
                        </span>
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] px-2 py-0.5 rounded-lg font-medium">
                          @{n.author}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-xs">{formatTime(n.createdAt)}</span>
                        <button
                          onClick={() => handleDeleteNote(n.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          {t.delete}
                        </button>
                      </div>
                    </div>

                    <div className="text-slate-700 text-xs whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto py-1">
                      {n.body || "(boş içerik)"}
                    </div>

                    <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                      <div>
                        <span>IP: <strong className="text-slate-600">{n.createdIp || "127.0.0.1"}</strong></span>
                        <span className="mx-2 text-slate-200">•</span>
                        <span>Cihaz: {n.userAgent || "bilinmiyor"}</span>
                      </div>
                      <div>
                        <span>{t.expiresAt}: <strong className="text-slate-600">{formatTime(n.expiresAt)}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">{t.emptyAdmin}</div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 p-3.5 font-semibold text-slate-500 text-xs bg-slate-50 border-b border-slate-200">
                <span className="col-span-3">{t.username}</span>
                <span className="col-span-2">Rol</span>
                <span className="col-span-2">{t.userNotesCount}</span>
                <span className="col-span-3">Son IP / Kayıt</span>
                <span className="col-span-2 text-right">{t.actions}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="grid grid-cols-12 p-3.5 text-slate-700 text-xs hover:bg-slate-50 items-center transition"
                  >
                    <span className="col-span-3 font-semibold text-slate-900">@{u.username}</span>
                    <span className="col-span-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${
                          u.role === "ADMIN"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {u.role}
                      </span>
                    </span>
                    <span className="col-span-2 text-slate-600">{u.noteCount} not</span>
                    <div className="col-span-3 text-[11px] text-slate-500">
                      <div>{u.lastIp || "127.0.0.1"}</div>
                      <div className="text-[10px] text-slate-400">{formatTime(u.createdAt)}</div>
                    </div>
                    <div className="col-span-2 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer"
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
