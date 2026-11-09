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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-orange-50/60 via-[#fafafb] to-orange-100/30">
      {/* Background Decorative Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Auth Card */}
      <div className="relative w-full max-w-sm bg-white border border-zinc-200/90 rounded-2xl shadow-xl shadow-zinc-950/5 p-7 space-y-6">
        {/* Header & Language Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              N
            </div>
            <span className="font-bold text-base text-zinc-900 tracking-tight">
              {t.appName}
            </span>
          </div>

          <div className="flex gap-1 bg-zinc-100/90 p-1 rounded-lg">
            {languages.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLanguageChange(l)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase transition ${
                  lang === l
                    ? "bg-white text-orange-600 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-900">
            {isRegister ? t.registerTitle : t.loginTitle}
          </h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {t.authNotice}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200/80 rounded-lg p-2.5 text-xs text-red-600 text-center font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              {t.username}
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="kullanici_adi"
              className="w-full bg-zinc-50/60 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-3 focus:ring-orange-500/15 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              {t.password}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-50/60 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-3 focus:ring-orange-500/15 transition"
            />
          </div>

          {isRegister && (
            <div>
              {!showAdminKey ? (
                <button
                  type="button"
                  onClick={() => setShowAdminKey(true)}
                  className="text-xs text-zinc-500 hover:text-orange-600 transition"
                >
                  + {t.adminKey}
                </button>
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-700">
                    {t.adminKey}
                  </label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="secret"
                    className="w-full bg-zinc-50/60 border border-zinc-300 rounded-lg px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-3 focus:ring-orange-500/15 transition"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-2.5 rounded-lg shadow-sm hover:shadow transition disabled:opacity-50 text-sm cursor-pointer"
          >
            {loading ? t.saving : isRegister ? t.registerBtn : t.loginBtn}
          </button>
        </form>

        {/* Toggle Account Mode */}
        <div className="border-t border-zinc-100 pt-3 text-center text-xs text-zinc-600">
          <span>{isRegister ? t.hasAccount : t.noAccount} </span>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-orange-600 hover:text-orange-700 font-semibold ml-1 cursor-pointer"
          >
            {isRegister ? t.signIn : t.signUp}
          </button>
        </div>

        {/* Legal Disclaimer */}
        <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
          {t.legalDisclaimer}
        </p>
      </div>
    </div>
  );
}
