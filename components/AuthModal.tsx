"use client";

import { useState } from "react";
import { Language, translations } from "@/lib/i18n";

interface AuthModalProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onSuccess: (user: { id: string; username: string; role: string }) => void;
}

export function AuthModal({ lang, onLanguageChange, onSuccess }: AuthModalProps) {
  const t = translations[lang];
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload: Record<string, string> = { username, password };
      if (isRegister && adminKey.trim()) payload.adminKey = adminKey.trim();

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İşlem başarısız.");

      onSuccess(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const languages: Language[] = ["tr", "en", "de", "ru"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-200/50">
      {/* Background Subtle Gradient Blobs for warmth */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white border border-slate-200/90 rounded-2xl shadow-[0_10px_35px_-4px_rgba(15,23,42,0.08)] p-8 space-y-6">
        {/* Top bar with wordmark & language switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center cursor-pointer group" title="notsuscato">
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors duration-150">
              notsuscato<span className="text-indigo-600 group-hover:text-indigo-500 inline-block transition-transform duration-150 group-hover:scale-125 origin-bottom">.</span>
            </span>
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {languages.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLanguageChange(l)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase transition cursor-pointer ${
                  lang === l
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Title & friendly intro */}
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            {isRegister ? t.registerTitle : t.loginTitle}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {t.authNotice}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200/80 rounded-xl p-3 text-xs text-red-600 font-medium text-center">
            {error}
          </div>
        )}

        {/* Inputs Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              {t.username}
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="kullanici_adi"
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              {t.password}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
            />
          </div>

          {isRegister && (
            <div>
              {!showAdminKey ? (
                <button
                  type="button"
                  onClick={() => setShowAdminKey(true)}
                  className="text-xs text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                >
                  + {t.adminKey}
                </button>
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    {t.adminKey}
                  </label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="secret"
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-2.5 rounded-xl shadow-xs transition disabled:opacity-50 text-sm cursor-pointer"
          >
            {loading ? t.saving : isRegister ? t.registerBtn : t.loginBtn}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          <span>{isRegister ? t.hasAccount : t.noAccount} </span>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-indigo-600 hover:text-indigo-700 font-semibold ml-1 cursor-pointer"
          >
            {isRegister ? t.signIn : t.signUp}
          </button>
        </div>

        {/* Legal Disclaimer */}
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          {t.legalDisclaimer}
        </p>
      </div>
    </div>
  );
}
