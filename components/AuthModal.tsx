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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-[#fafafa]">
      {/* Optional Rain/Ambient Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-40"
      >
        <source src="/rain.mp4" type="video/mp4" />
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* Frosted Glass Buğu Katmanı */}
      <div className="absolute inset-0 backdrop-blur-[4px] bg-[#fafafa]/80 z-0 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6">
        
        {/* Left Side: Crisp Functional Story & Specs */}
        <div className="md:col-span-7 space-y-6 px-2 sm:px-4">
          <div>
            <div className="cursor-pointer group inline-block select-none mb-3">
              <span className="text-2xl font-bold tracking-tight text-zinc-900 group-hover:text-zinc-600 transition-colors">
                notsuscato<span className="text-zinc-400 group-hover:text-zinc-900 inline-block transition-colors">.</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight leading-snug">
              {t.welcomeHeadline}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed mt-2.5 max-w-lg font-normal">
              {t.welcomeDesc}
            </p>
          </div>

          {/* Minimalist Structured Specs List (Borders > Shadows) */}
          <div className="border border-zinc-200/90 bg-white/70 backdrop-blur-md rounded-xl divide-y divide-zinc-100 shadow-2xs">
            <div className="p-3.5 flex items-start gap-3">
              <span className="font-mono text-zinc-400 font-semibold text-[11px] mt-0.5">01</span>
              <div>
                <div className="text-xs font-semibold text-zinc-900">{t.feature1Title}</div>
                <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{t.feature1Desc}</div>
              </div>
            </div>

            <div className="p-3.5 flex items-start gap-3">
              <span className="font-mono text-zinc-400 font-semibold text-[11px] mt-0.5">02</span>
              <div>
                <div className="text-xs font-semibold text-zinc-900">{t.feature2Title}</div>
                <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{t.feature2Desc}</div>
              </div>
            </div>

            <div className="p-3.5 flex items-start gap-3">
              <span className="font-mono text-zinc-400 font-semibold text-[11px] mt-0.5">03</span>
              <div>
                <div className="text-xs font-semibold text-zinc-900">{t.feature3Title}</div>
                <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{t.feature3Desc}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Monochromatic Auth Card */}
        <div className="md:col-span-5 w-full max-w-sm mx-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-zinc-200/90 rounded-2xl shadow-[0_4px_24px_-2px_rgba(0,0,0,0.05)] p-7 space-y-5">
            {/* Top Bar with Language Selector */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-xs font-semibold tracking-tight text-zinc-900 uppercase">
                {isRegister ? t.registerTitle : t.loginTitle}
              </span>

              <div className="flex gap-1 bg-zinc-100 p-0.5 rounded-lg">
                {languages.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => onLanguageChange(l)}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase transition cursor-pointer ${
                      lang === l
                        ? "bg-white text-zinc-900 shadow-2xs"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200/80 rounded-xl p-2.5 text-xs text-red-600 font-medium text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {t.username}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="kullanici_adi"
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {t.password}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition"
                />
              </div>

              {isRegister && (
                <div>
                  {!showAdminKey ? (
                    <button
                      type="button"
                      onClick={() => setShowAdminKey(true)}
                      className="text-xs text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                    >
                      + {t.adminKey}
                    </button>
                  ) : (
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-zinc-700">
                        {t.adminKey}
                      </label>
                      <input
                        type="password"
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        placeholder="secret"
                        className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition"
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white font-medium py-2.5 rounded-xl shadow-xs active:scale-[0.98] transition-all duration-150 disabled:opacity-50 text-sm cursor-pointer mt-1"
              >
                {loading ? t.saving : isRegister ? t.registerBtn : t.loginBtn}
              </button>
            </form>

            {/* Toggle */}
            <div className="border-t border-zinc-100 pt-3 text-center text-xs text-zinc-500">
              <span>{isRegister ? t.hasAccount : t.noAccount} </span>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-zinc-900 hover:underline font-semibold ml-1 cursor-pointer"
              >
                {isRegister ? t.signIn : t.signUp}
              </button>
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
              {t.legalDisclaimer}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
