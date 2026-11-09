"use client";

import { useState, useRef } from "react";
import { Language, translations } from "@/lib/i18n";
import { UserProfile, NoteTheme } from "./ProfileModal";

interface ProfilePageProps {
  user: UserProfile;
  lang: Language;
  onBack: () => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onLogout: () => void;
}

export function ProfilePage({
  user,
  lang,
  onBack,
  onUpdateUser,
  onLogout,
}: ProfilePageProps) {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar state
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  const currentTheme = (user.theme as NoteTheme) || "clean";

  // Pre-made minimalist avatar presets
  const presetAvatars = [
    {
      id: "preset-dark",
      label: "Mono",
      bg: "bg-zinc-900 text-white",
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
      ),
    },
    {
      id: "preset-amber",
      label: "Gold",
      bg: "bg-amber-600 text-white",
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      id: "preset-emerald",
      label: "Emerald",
      bg: "bg-emerald-700 text-white",
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      id: "preset-slate",
      label: "Zinc",
      bg: "bg-zinc-700 text-white",
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
  ];

  // Robust client-side file upload and compression
  const uploadAvatarData = async (dataUrl: string | null) => {
    setAvatarLoading(true);
    setAvatarError(null);
    setAvatarSuccess(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: dataUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Görsel kaydedilemedi.");

      onUpdateUser({ avatar: dataUrl });
      if (dataUrl) {
        setAvatarSuccess("Profil fotoğrafı başarıyla güncellendi.");
      } else {
        setAvatarSuccess("Profil fotoğrafı kaldırıldı.");
      }
      setTimeout(() => setAvatarSuccess(null), 4000);
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : "Yükleme sırasında hata oluştu.");
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setAvatarError("Görsel boyutu en fazla 8MB olabilir.");
      return;
    }

    setAvatarLoading(true);
    setAvatarError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const rawResult = reader.result as string;
      if (!rawResult) {
        setAvatarError("Görsel okunamadı.");
        setAvatarLoading(false);
        return;
      }

      // Optimize image via canvas to 250x250 for crisp avatars & instant storage
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 260;
          let width = img.width || 260;
          let height = img.height || 260;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext("2d");

          let finalDataUrl = rawResult;
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            finalDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          }

          await uploadAvatarData(finalDataUrl);
        } catch {
          // If canvas fails, upload raw dataUrl directly
          await uploadAvatarData(rawResult);
        }
      };

      img.onerror = async () => {
        await uploadAvatarData(rawResult);
      };

      img.src = rawResult;
    };

    reader.onerror = () => {
      setAvatarError("Görsel dosyası okunamadı.");
      setAvatarLoading(false);
    };

    reader.readAsDataURL(file);
  };

  // Convert preset SVG to small base64 avatar
  const handleSelectPreset = async (presetId: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (presetId === "preset-dark") {
      ctx.fillStyle = "#18181b";
    } else if (presetId === "preset-amber") {
      ctx.fillStyle = "#d97706";
    } else if (presetId === "preset-emerald") {
      ctx.fillStyle = "#047857";
    } else {
      ctx.fillStyle = "#3f3f46";
    }

    ctx.beginPath();
    ctx.arc(80, 80, 80, 0, Math.PI * 2);
    ctx.fill();

    // Draw initials in center
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 64px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(user.username.slice(0, 2).toUpperCase(), 80, 84);

    const presetDataUrl = canvas.toDataURL("image/png");
    await uploadAvatarData(presetDataUrl);
  };

  // Handle Theme Change
  const handleThemeSelect = async (themeKey: NoteTheme) => {
    onUpdateUser({ theme: themeKey });
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeKey }),
      });
    } catch (err) {
      console.error("Tema kaydedilemedi:", err);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ type: "idle" });

    if (!currentPassword) {
      setPasswordStatus({
        type: "error",
        message: "Lütfen mevcut şifrenizi girin.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({
        type: "error",
        message: "Yeni şifre en az 6 karakter olmalıdır.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: "error",
        message: t.passwordMismatch,
      });
      return;
    }

    setPasswordStatus({ type: "loading" });

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Şifre değiştirilemedi.");

      setPasswordStatus({
        type: "success",
        message: t.passwordChangedSuccess,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Hata oluştu.",
      });
    }
  };

  const themes: Array<{
    id: NoteTheme;
    name: string;
    description: string;
    preview: React.ReactNode;
  }> = [
    {
      id: "clean",
      name: t.themeClean,
      description: "Temiz, dikkat dağıtmayan saf beyaz çalışma alanı.",
      preview: <div className="w-full h-12 rounded-lg bg-white border border-zinc-200 shadow-2xs" />,
    },
    {
      id: "dark",
      name: t.themeDark,
      description: "Göz yormayan, monokrom derin gece/obsidian modu.",
      preview: <div className="w-full h-12 rounded-lg bg-[#18181b] border border-zinc-800 shadow-2xs" />,
    },
    {
      id: "dots",
      name: t.themeDots,
      description: "Mühendislik ve eskiz defteri noktalı ızgara dokusu.",
      preview: (
        <div
          className="w-full h-12 rounded-lg bg-white border border-zinc-200 shadow-2xs"
          style={{
            backgroundImage: "radial-gradient(#a1a1aa 1.2px, transparent 1.2px)",
            backgroundSize: "8px 8px",
          }}
        />
      ),
    },
    {
      id: "lines",
      name: t.themeLines,
      description: "Klasik defter yatay çizgileriyle sade yazım alanı.",
      preview: (
        <div
          className="w-full h-12 rounded-lg bg-white border border-zinc-200 shadow-2xs"
          style={{
            backgroundImage: "linear-gradient(to bottom, transparent 8px, #e4e4e7 9px)",
            backgroundSize: "100% 9px",
          }}
        />
      ),
    },
    {
      id: "sepia",
      name: t.themeSepia,
      description: "Sıcak parşömen ve nostaljik kitap kağıdı tonu.",
      preview: <div className="w-full h-12 rounded-lg bg-[#f4ecd8] border border-[#e2d5ba] shadow-2xs" />,
    },
    {
      id: "glass",
      name: t.themeGlass,
      description: "Buzlu şeffaf cam ve hafif yağmur arka planı.",
      preview: (
        <div className="w-full h-12 rounded-lg bg-white/70 border border-zinc-200 backdrop-blur-xs flex items-center justify-center text-xs font-mono text-zinc-500 shadow-2xs">
          glassmorphism
        </div>
      ),
    },
  ];

  const formatCreationDate = (iso?: string) => {
    if (!iso) return "Yeni hesap";
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString("tr-TR")}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafa] overflow-y-auto">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-zinc-200/80 px-6 sm:px-10 flex items-center justify-between bg-white select-none sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold px-3 py-1.5 rounded-xl active:scale-[0.98] transition cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>{t.backToNotes}</span>
          </button>

          <span className="text-zinc-300">/</span>

          <span className="font-bold text-sm tracking-tight text-zinc-900">
            {t.manageProfile}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-medium">@{user.username}</span>
          <button
            type="button"
            onClick={onLogout}
            className="text-zinc-500 hover:text-red-600 hover:bg-zinc-100 px-2.5 py-1 rounded-xl text-xs active:scale-[0.98] transition cursor-pointer font-medium"
          >
            {t.logout}
          </button>
        </div>
      </header>

      {/* Main Full-Page Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 space-y-10">
        
        {/* Section 1: Hero Profile Card */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            
            {/* Big Avatar */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-2xl overflow-hidden border-2 border-zinc-200 shadow-sm relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="uppercase tracking-wider font-mono text-xl">
                    {user.username.slice(0, 2)}
                  </span>
                )}

                {avatarLoading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-medium">
                    Yükleniyor...
                  </div>
                )}
              </div>

              {/* Quick camera trigger button on hover */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Fotoğraf Yükle"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-white flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>

            {/* Profile Info & Actions */}
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight truncate">
                  @{user.username}
                </h1>
                <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 text-xs font-semibold px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                  {user.role}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-normal">
                <span>{t.registeredOn}: <strong className="text-zinc-700 font-medium">{formatCreationDate(user.createdAt)}</strong></span>
                <span>•</span>
                <span>{t.totalNotes}: <strong className="text-zinc-700 font-medium">{user.noteCount ?? 0} not</strong></span>
              </div>

              {/* Upload & Remove Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Real hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="sr-only"
                  tabIndex={-1}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium px-4 py-2 rounded-xl active:scale-[0.98] transition cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {t.uploadPhoto}
                </button>

                {user.avatar && (
                  <button
                    type="button"
                    onClick={() => uploadAvatarData(null)}
                    disabled={avatarLoading}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200/80 font-medium px-3 py-2 rounded-xl active:scale-[0.98] transition cursor-pointer"
                  >
                    {t.removePhoto}
                  </button>
                )}
              </div>

              {/* Preset Avatars */}
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 font-medium">Hazır avatarlar:</span>
                <div className="flex items-center gap-1.5">
                  {presetAvatars.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.id)}
                      className={`w-7 h-7 rounded-full ${p.bg} flex items-center justify-center text-xs shadow-2xs hover:scale-105 active:scale-95 transition cursor-pointer`}
                      title={`${p.label} avatarını kullan`}
                    >
                      {p.svg}
                    </button>
                  ))}
                </div>
              </div>

              {avatarError && (
                <div className="bg-red-50 border border-red-200/80 rounded-xl p-2.5 text-xs text-red-600 font-medium">
                  {avatarError}
                </div>
              )}

              {avatarSuccess && (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 text-xs text-emerald-700 font-medium">
                  {avatarSuccess}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Notepad Theme Selection */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              {t.noteTheme}
            </h2>
            <p className="text-xs text-zinc-500 font-normal">
              Not düzenleyicinizin çalışma alanı arka planını ve görünüm dokusunu dilediğiniz gibi seçin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {themes.map((th) => {
              const isSelected = currentTheme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => handleThemeSelect(th.id)}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-3 transition cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? "border-zinc-900 ring-2 ring-zinc-900/10 bg-zinc-50/80 shadow-xs"
                      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/40"
                  }`}
                >
                  {th.preview}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">
                        {th.name}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-zinc-900" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-normal">
                      {th.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Password & Security */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              {t.changePassword}
            </h2>
            <p className="text-xs text-zinc-500 font-normal">
              Hesabınızı korumak için güçlü bir parola kullanın ve düzenli olarak güncelleyin.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            {passwordStatus.type === "error" && (
              <div className="bg-red-50 border border-red-200/80 rounded-xl p-3 text-xs text-red-600 font-medium">
                {passwordStatus.message}
              </div>
            )}

            {passwordStatus.type === "success" && (
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-700 font-medium">
                {passwordStatus.message}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 block">
                {t.currentPassword}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 block">
                {t.newPassword}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="•••••••• (en az 6 karakter)"
                className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 block">
                {t.confirmNewPassword}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordStatus.type === "loading"}
              className="bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white font-medium px-5 py-2.5 rounded-xl text-xs shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              {passwordStatus.type === "loading" ? "Güncelleniyor..." : t.savePassword}
            </button>
          </form>
        </div>

        {/* Section 4: Ephemeral & Legal Transparency */}
        <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-6 text-xs text-zinc-500 space-y-2">
          <div className="font-semibold text-zinc-800">Uçucu & İz Bırakmayan Sistem Notu</div>
          <p className="leading-relaxed">
            {t.legalDisclaimer} Notlarınız belirlediğiniz sürenin (2–24 saat) sonunda veritabanından kalıcı olarak silinir. TXT veya ZIP dışa aktarımı yaparak notlarınızı dilediğiniz zaman kendi cihazınızda arşivleyebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}

