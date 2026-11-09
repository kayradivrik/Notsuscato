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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 font-mono text-xs text-zinc-300">
      <div className="w-full max-w-sm border border-zinc-800 bg-zinc-950 p-6 space-y-5 shadow-2xl">
        {/* Top bar with language switcher */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <span className="font-bold tracking-widest text-white text-sm">
            {t.appName}
          </span>
          <div className="flex gap-1.5 text-[10px]">
            {languages.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLanguageChange(l)}
                className={`px-1 py-0.5 uppercase transition ${
                  lang === l
                    ? "text-white font-bold underline"
                    : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Card Title */}
        <div className="text-center space-y-1">
          <h2 className="text-sm font-semibold text-zinc-100">
            {isRegister ? t.registerTitle : t.loginTitle}
          </h2>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            {t.authNotice}
          </p>
        </div>

        {error && (
          <div className="border border-red-900/60 bg-red-950/30 p-2 text-red-400 text-[11px] text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              {t.username}
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full border border-zinc-800 bg-black px-3 py-2 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              {t.password}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-zinc-800 bg-black px-3 py-2 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 text-xs"
            />
          </div>

          {isRegister && (
            <div>
              {!showAdminKey ? (
                <button
                  type="button"
                  onClick={() => setShowAdminKey(true)}
                  className="text-[10px] text-zinc-600 hover:text-zinc-400 underline"
                >
                  + {t.adminKey}
                </button>
              ) : (
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">
                    {t.adminKey}
                  </label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="secret"
                    className="w-full border border-zinc-800 bg-black px-3 py-1.5 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 text-xs"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-zinc-700 bg-zinc-900 py-2 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-500 font-semibold transition disabled:opacity-50 text-xs"
          >
            {loading ? t.saving : isRegister ? t.registerBtn : t.loginBtn}
          </button>
        </form>

        {/* Toggle between Register / Login */}
        <div className="border-t border-zinc-900 pt-3 text-center text-[11px] text-zinc-500">
          <span>{isRegister ? t.hasAccount : t.noAccount} </span>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-zinc-200 hover:underline font-bold ml-1"
          >
            {isRegister ? t.signIn : t.signUp}
          </button>
        </div>
      </div>
    </div>
  );
}
