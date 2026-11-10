"use client";

import { useState, useEffect } from "react";
import { Language, translations } from "@/lib/i18n";

interface AdminNote {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isShared?: boolean;
  shareId?: string | null;
  views?: number;
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

interface AdminReport {
  id: string;
  noteId: string;
  reason: string;
  details?: string | null;
  ip?: string | null;
  status: string;
  createdAt: string;
  noteTitle: string;
  noteAuthor: string;
  noteShared: boolean;
  shareId?: string | null;
}

interface AdminStats {
  totalNotes: number;
  totalUsers: number;
  notesLast24h: number;
  totalReports: number;
}

interface AdminModalProps {
  lang: Language;
  onClose: () => void;
}

export function AdminModal({ lang, onClose }: AdminModalProps) {
  const t = translations[lang];
  const [tab, setTab] = useState<"notes" | "users" | "reports">("notes");
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalNotes: 0,
    totalUsers: 0,
    notesLast24h: 0,
    totalReports: 0,
  });
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
      setReports(data.reports || []);
      if (data.stats) {
        setStats(data.stats);
      }
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
        setReports((prev) => prev.filter((r) => r.noteId !== id));
        setStats((prev) => ({ ...prev, totalNotes: Math.max(0, prev.totalNotes - 1) }));
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
        setStats((prev) => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/admin?type=report&id=${reportId}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setStats((prev) => ({ ...prev, totalReports: Math.max(0, prev.totalReports - 1) }));
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

  const filteredReports = reports.filter(
    (r) =>
      r.noteTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.noteAuthor.toLowerCase().includes(search.toLowerCase()) ||
      (r.ip && r.ip.includes(search))
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
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/40 backdrop-blur-xs p-2 sm:p-8">
      <div className="flex-1 flex flex-col bg-white border border-zinc-200/90 rounded-2xl shadow-2xl overflow-hidden max-w-6xl w-full mx-auto">
        {/* Top Header */}
        <div className="h-14 border-b border-zinc-200/80 px-3 sm:px-6 flex items-center justify-between select-none bg-zinc-50/70 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-zinc-900" />
              <span className="font-bold text-zinc-900 text-xs sm:text-sm tracking-tight truncate">
                {t.adminPanel}
              </span>
            </div>
            <span className="text-zinc-300 hidden sm:inline">|</span>
            <div className="flex gap-1 bg-zinc-100 p-0.5 sm:p-1 rounded-xl text-[11px] sm:text-xs shrink-0">
              <button
                onClick={() => setTab("notes")}
                className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  tab === "notes"
                    ? "bg-white text-zinc-900 shadow-xs font-semibold"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {t.allNotes} ({notes.length})
              </button>
              <button
                onClick={() => setTab("users")}
                className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  tab === "users"
                    ? "bg-white text-zinc-900 shadow-xs font-semibold"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {t.allUsers} ({users.length})
              </button>
              <button
                onClick={() => setTab("reports")}
                className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  tab === "reports"
                    ? "bg-white text-zinc-900 shadow-xs font-semibold"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <span>{t.reportsTab}</span>
                {reports.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {reports.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="bg-white border border-zinc-200 rounded-xl px-2.5 sm:px-3 py-1.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 text-xs w-24 sm:w-48"
            />
            <button
              onClick={onClose}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium active:scale-[0.98] transition cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>

        {/* Stats & Actions Bar */}
        <div className="bg-zinc-50/50 border-b border-zinc-200/70 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="bg-white border border-zinc-200/80 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xs">
              <span className="text-zinc-400 font-medium">{t.totalUsersCount}:</span>
              <span className="font-bold text-zinc-900">{stats.totalUsers}</span>
            </div>
            <div className="bg-white border border-zinc-200/80 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xs">
              <span className="text-zinc-400 font-medium">{t.activeNotes}:</span>
              <span className="font-bold text-zinc-900">{stats.totalNotes}</span>
            </div>
            <div className="bg-white border border-zinc-200/80 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xs">
              <span className="text-zinc-400 font-medium">{t.last24hNotes}:</span>
              <span className="font-bold text-zinc-900">{stats.notesLast24h}</span>
            </div>
            <div className="bg-white border border-zinc-200/80 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xs">
              <span className="text-zinc-400 font-medium">{t.reportsTab}:</span>
              <span className={`font-bold ${stats.totalReports > 0 ? "text-red-600" : "text-zinc-900"}`}>
                {stats.totalReports}
              </span>
            </div>
          </div>

          <a
            href="/api/admin/backup"
            download
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-3.5 py-1.5 rounded-xl transition shadow-xs active:scale-95 cursor-pointer text-xs shrink-0"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{t.backupDownload}</span>
          </a>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-white">
          {loading ? (
            <div className="p-12 text-center text-zinc-400 text-sm">{t.saving}</div>
          ) : tab === "notes" ? (
            filteredNotes.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-sm">{t.emptyAdmin}</div>
            ) : (
              <div className="space-y-4">
                {filteredNotes.map((n) => (
                  <div
                    key={n.id}
                    className="border border-zinc-200 rounded-xl p-4 space-y-2.5 bg-zinc-50/40 hover:bg-white hover:border-zinc-300 hover:shadow-xs transition"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-900 text-sm">
                          {n.title || t.untitled}
                        </span>
                        <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] px-2 py-0.5 rounded-lg font-medium">
                          @{n.author}
                        </span>
                        {n.isShared && (
                          <a
                            href={`/s/${n.shareId || n.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1 hover:underline"
                          >
                            <span>🔗 {t.shareActive} ({n.views || 0} {t.openInNewTab})</span>
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400 text-xs">{formatTime(n.createdAt)}</span>
                        <button
                          onClick={() => handleDeleteNote(n.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-lg text-xs font-medium active:scale-[0.98] transition cursor-pointer"
                        >
                          {t.delete}
                        </button>
                      </div>
                    </div>

                    <div className="text-zinc-700 text-xs whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto py-1">
                      {n.body || "(boş içerik)"}
                    </div>

                    <div className="border-t border-zinc-100 pt-2 text-[11px] text-zinc-400 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span>IP: <strong className="text-zinc-600 font-medium">{n.createdIp || "127.0.0.1"}</strong></span>
                        <span className="mx-2 text-zinc-300">•</span>
                        <span>Cihaz: {n.userAgent || "bilinmiyor"}</span>
                      </div>
                      <div>
                        <span>{t.expiresAt}: <strong className="text-zinc-600 font-medium">{formatTime(n.expiresAt)}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : tab === "users" ? (
            filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-sm">{t.emptyAdmin}</div>
            ) : (
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 p-3.5 font-semibold text-zinc-500 text-xs bg-zinc-50 border-b border-zinc-200">
                  <span className="col-span-3">{t.username}</span>
                  <span className="col-span-2">Rol</span>
                  <span className="col-span-2">{t.userNotesCount}</span>
                  <span className="col-span-3">Son IP / Kayıt</span>
                  <span className="col-span-2 text-right">{t.actions}</span>
                </div>
                <div className="divide-y divide-zinc-100">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="grid grid-cols-12 p-3.5 text-zinc-700 text-xs hover:bg-zinc-50 items-center transition"
                    >
                      <span className="col-span-3 font-semibold text-zinc-900">@{u.username}</span>
                      <span className="col-span-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] rounded-md font-semibold ${
                            u.role === "ADMIN"
                              ? "bg-zinc-900 text-white"
                              : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                          }`}
                        >
                          {u.role}
                        </span>
                      </span>
                      <span className="col-span-2 text-zinc-600">{u.noteCount} not</span>
                      <div className="col-span-3 text-[11px] text-zinc-500">
                        <div>{u.lastIp || "127.0.0.1"}</div>
                        <div className="text-[10px] text-zinc-400">{formatTime(u.createdAt)}</div>
                      </div>
                      <div className="col-span-2 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-lg text-xs font-medium active:scale-[0.98] transition cursor-pointer"
                        >
                          {t.delete}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            /* Reports Tab */
            filteredReports.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-sm">{t.noReports}</div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((r) => (
                  <div
                    key={r.id}
                    className="border border-red-200/80 bg-red-50/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-900 text-sm">{r.noteTitle}</span>
                        <span className="text-xs bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-lg">
                          {r.reason}
                        </span>
                        <span className="text-zinc-500 text-xs">Yazar: @{r.noteAuthor}</span>
                      </div>
                      {r.details && (
                        <p className="text-zinc-600 text-xs italic bg-white/70 p-2 rounded-lg border border-zinc-200/60">
                          &ldquo;{r.details}&rdquo;
                        </p>
                      )}
                      <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                        <span>Bildiren IP: {r.ip || "127.0.0.1"}</span>
                        <span>•</span>
                        <span>{formatTime(r.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {r.shareId && (
                        <a
                          href={`/s/${r.shareId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                        >
                          {t.openInNewTab}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(r.noteId)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer shadow-xs"
                      >
                        Notu Kalıcı Olarak Sil
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismissReport(r.id)}
                        className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                      >
                        {t.dismissReport}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
