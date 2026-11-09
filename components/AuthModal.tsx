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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-slate-100/60 to-indigo-50/20">
      {/* Background Soft Blobs */}
      <div className="fixed top-12 left-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-12 right-1/4 w-96 h-96 bg-slate-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6">
        
        {/* Left Side: Welcoming Story & Information */}
        <div className="md:col-span-7 space-y-6 px-2 sm:px-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs px-3 py-1 rounded-full font-medium mb-4">
              <span>✦</span>
              <span>{t.welcomeBadge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              notsuscato<span className="text-indigo-600">.</span>
            </h1>

            <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-2 tracking-tight">
              {t.welcomeHeadline}
            </p>

            <p className="text-sm text-slate-600 leading-relaxed mt-3 max-w-lg">
              {t.welcomeDesc}
            </p>
          </div>

          {/* Sweet Micro-Features */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 bg-white/70 border border-slate-200/70 p-3 rounded-2xl shadow-2xs">
              <span className="text-indigo-600 font-bold text-base mt-0.5">•</span>
              <div>
                <h2 className="text-xs font-bold text-slate-900">{t.feature1Title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{t.feature1Desc}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/70 border border-slate-200/70 p-3 rounded-2xl shadow-2xs">
              <span className="text-indigo-600 font-bold text-base mt-0.5">•</span>
              <div>
                <h2 className="text-xs font-bold text-slate-900">{t.feature2Title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{t.feature2Desc}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/70 border border-slate-200/70 p-3 rounded-2xl shadow-2xs">
              <span className="text-indigo-600 font-bold text-base mt-0.5">•</span>
              <div>
                <h2 className="text-xs font-bold text-slate-900">{t.feature3Title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{t.feature3Desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Auth Card */}
        <div className="md:col-span-5 w-full max-w-sm mx-auto">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_10px_30px_-5px_rgba(15,23,42,0.08)] p-7 space-y-5">
            {/* Top Bar with Language Selector */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div
                className="cursor-pointer group select-none"
                title="notsuscato"
              >
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  notsuscato<span className="text-indigo-600 group-hover:text-indigo-500 inline-block transition-transform group-hover:scale-125 origin-bottom">.</span>
                </span>
              </div>

              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {languages.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => onLanguageChange(l)}
                    className={`px-1.5 py-0.5 rounded-lg text-[10px] font-semibold uppercase transition cursor-pointer ${
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

            {/* Title */}
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {isRegister ? t.registerTitle : t.loginTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.authNotice}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200/80 rounded-xl p-2.5 text-xs text-red-600 font-medium text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.username}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="kullanici_adi"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.password}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition"
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
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition"
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-2.5 rounded-xl shadow-xs transition disabled:opacity-50 text-sm cursor-pointer mt-1"
              >
                {loading ? t.saving : isRegister ? t.registerBtn : t.loginBtn}
              </button>
            </form>

            {/* Toggle */}
            <div className="border-t border-slate-100 pt-3 text-center text-xs text-slate-500">
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

            {/* Disclaimer */}
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              {t.legalDisclaimer}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
