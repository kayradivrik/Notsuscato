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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-slate-900">
      {/* Background Video (Rain / Ambient) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-70"
      >
        <source src="/rain.mp4" type="video/mp4" />
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* Atmospheric Fallback Ambient Gradient (Video olmadığında veya yüklenirken) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-indigo-950/80 z-0 pointer-events-none" />

      {/* Frosted Glass (Buğu ve Sis Katmanı) */}
      <div className="absolute inset-0 backdrop-blur-md bg-slate-950/30 z-0 pointer-events-none" />

      {/* Main Glass Container */}
      <div className="relative z-10 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6">
        
        {/* Left Side: Welcoming Glass Panel */}
        <div className="md:col-span-7 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-7 sm:p-8 shadow-2xl space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full font-medium mb-4 shadow-2xs">
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

          {/* Sweet Micro-Features in frosted pills */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm border border-white/60 p-3 rounded-2xl shadow-2xs">
              <span className="text-indigo-600 font-bold text-base mt-0.5">•</span>
              <div>
                <h2 className="text-xs font-bold text-slate-900">{t.feature1Title}</h2>
                <p className="text-xs text-slate-600 mt-0.5">{t.feature1Desc}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm border border-white/60 p-3 rounded-2xl shadow-2xs">
              <span className="text-indigo-600 font-bold text-base mt-0.5">•</span>
              <div>
                <h2 className="text-xs font-bold text-slate-900">{t.feature2Title}</h2>
                <p className="text-xs text-slate-600 mt-0.5">{t.feature2Desc}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm border border-white/60 p-3 rounded-2xl shadow-2xs">
              <span className="text-indigo-600 font-bold text-base mt-0.5">•</span>
              <div>
                <h2 className="text-xs font-bold text-slate-900">{t.feature3Title}</h2>
                <p className="text-xs text-slate-600 mt-0.5">{t.feature3Desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Frosted Glass Auth Card */}
        <div className="md:col-span-5 w-full max-w-sm mx-auto">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-2xl p-7 space-y-5">
            {/* Top Bar with Language Selector */}
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
              <div
                className="cursor-pointer group select-none"
                title="notsuscato"
              >
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  notsuscato<span className="text-indigo-600 group-hover:text-indigo-500 inline-block transition-transform group-hover:scale-125 origin-bottom">.</span>
                </span>
              </div>

              <div className="flex gap-1 bg-slate-200/50 backdrop-blur-sm p-1 rounded-xl">
                {languages.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => onLanguageChange(l)}
                    className={`px-1.5 py-0.5 rounded-lg text-[10px] font-semibold uppercase transition cursor-pointer ${
                      lang === l
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
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
              <p className="text-xs text-slate-600 mt-0.5">
                {t.authNotice}
              </p>
            </div>

            {error && (
              <div className="bg-red-50/90 border border-red-200 rounded-xl p-2.5 text-xs text-red-600 font-medium text-center shadow-xs">
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
                  className="w-full bg-white/70 border border-slate-200/90 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 transition shadow-2xs"
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
                  className="w-full bg-white/70 border border-slate-200/90 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 transition shadow-2xs"
                />
              </div>

              {isRegister && (
                <div>
                  {!showAdminKey ? (
                    <button
                      type="button"
                      onClick={() => setShowAdminKey(true)}
                      className="text-xs text-slate-500 hover:text-indigo-600 transition cursor-pointer"
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
                        className="w-full bg-white/70 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 transition shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-2.5 rounded-xl shadow-sm transition disabled:opacity-50 text-sm cursor-pointer mt-1"
              >
                {loading ? t.saving : isRegister ? t.registerBtn : t.loginBtn}
              </button>
            </form>

            {/* Toggle */}
            <div className="border-t border-slate-200/50 pt-3 text-center text-xs text-slate-600">
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
            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              {t.legalDisclaimer}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
