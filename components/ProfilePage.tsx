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

  // Tabs: "theme" | "security" | "info"
  const [activeTab, setActiveTab] = useState<"theme" | "security" | "info">("theme");

  // Avatar state
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  const currentTheme = (user.theme as NoteTheme) || "clean";

  // Preset Avatars definition
  const presetAvatars = [
    {
      id: "preset-ghost",
      label: "Anonim",
      bg: "bg-zinc-900",
      accent: "#ffffff",
      draw: (ctx: CanvasRenderingContext2D) => {
        // Ghost icon
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(80, 65, 35, Math.PI, 0, false);
        ctx.lineTo(115, 115);
        ctx.lineTo(103, 105);
        ctx.lineTo(92, 115);
        ctx.lineTo(80, 105);
        ctx.lineTo(68, 115);
        ctx.lineTo(57, 105);
        ctx.lineTo(45, 115);
        ctx.closePath();
        ctx.fill();
        // Eyes
        ctx.fillStyle = "#18181b";
        ctx.beginPath();
        ctx.arc(68, 65, 6, 0, Math.PI * 2);
        ctx.arc(92, 65, 6, 0, Math.PI * 2);
        ctx.fill();
      },
    },
    {
      id: "preset-terminal",
      label: "Terminal",
      bg: "bg-emerald-950",
      accent: "#10b981",
      draw: (ctx: CanvasRenderingContext2D) => {
        // Prompt >_
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 52px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(">_", 80, 80);
      },
    },
    {
      id: "preset-diamond",
      label: "Obsidian",
      bg: "bg-neutral-900",
      accent: "#a1a1aa",
      draw: (ctx: CanvasRenderingContext2D) => {
        // Diamond gem
        ctx.fillStyle = "#e4e4e7";
        ctx.beginPath();
        ctx.moveTo(80, 35);
        ctx.lineTo(125, 75);
        ctx.lineTo(80, 125);
        ctx.lineTo(35, 75);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "#18181b";
        ctx.lineWidth = 3;
        ctx.stroke();
      },
    },
    {
      id: "preset-star",
      label: "Sparkle",
      bg: "bg-amber-600",
      accent: "#ffffff",
      draw: (ctx: CanvasRenderingContext2D) => {
        // 4-point sparkle star
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(80, 35);
        ctx.quadraticCurveTo(80, 80, 125, 80);
        ctx.quadraticCurveTo(80, 80, 80, 125);
        ctx.quadraticCurveTo(80, 80, 35, 80);
        ctx.quadraticCurveTo(80, 80, 80, 35);
        ctx.fill();
      },
    },
    {
      id: "preset-monogram",
      label: "Mono",
      bg: "bg-blue-600",
      accent: "#ffffff",
      draw: (ctx: CanvasRenderingContext2D) => {
        // Monogram initial
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 54px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(user.username.slice(0, 2).toUpperCase(), 80, 83);
      },
    },
  ];

  // Upload or update avatar dataUrl
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
        setAvatarSuccess("Profil fotoğrafı güncellendi.");
      } else {
        setAvatarSuccess("Profil fotoğrafı kaldırıldı.");
      }
      setTimeout(() => setAvatarSuccess(null), 3000);
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
      setAvatarError("Lütfen geçerli bir görsel seçin (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setAvatarError("Görsel en fazla 8MB olabilir.");
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

      // Optimize image via canvas to 256x256 square
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement("canvas");
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            // Draw center-cropped square
            const minSide = Math.min(img.width, img.height);
            const startX = (img.width - minSide) / 2;
            const startY = (img.height - minSide) / 2;

            ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, size, size);
            const optimized = canvas.toDataURL("image/jpeg", 0.88);
            await uploadAvatarData(optimized);
          } else {
            await uploadAvatarData(rawResult);
          }
        } catch {
          await uploadAvatarData(rawResult);
        }
      };

      img.onerror = async () => {
        await uploadAvatarData(rawResult);
      };

      img.src = rawResult;
    };

    reader.onerror = () => {
      setAvatarError("Dosya okunamadı.");
      setAvatarLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleSelectPreset = async (presetId: string) => {
    const preset = presetAvatars.find((p) => p.id === presetId);
    if (!preset) return;

    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background circle
    if (preset.id === "preset-ghost") ctx.fillStyle = "#18181b";
    else if (preset.id === "preset-terminal") ctx.fillStyle = "#022c22";
    else if (preset.id === "preset-diamond") ctx.fillStyle = "#27272a";
    else if (preset.id === "preset-star") ctx.fillStyle = "#d97706";
    else ctx.fillStyle = "#2563eb";

    ctx.beginPath();
    ctx.arc(80, 80, 80, 0, Math.PI * 2);
    ctx.fill();

    // Draw preset symbol
    preset.draw(ctx);

    const presetDataUrl = canvas.toDataURL("image/png");
    await uploadAvatarData(presetDataUrl);
  };

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ type: "idle" });

    if (!currentPassword) {
      setPasswordStatus({ type: "error", message: "Mevcut şifrenizi girin." });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "Yeni şifre en az 6 karakter olmalıdır." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: t.passwordMismatch });
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
      if (!res.ok) throw new Error(data.error || "Şifre güncellenemedi.");

      setPasswordStatus({ type: "success", message: t.passwordChangedSuccess });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Bir hata oluştu.",
      });
    }
  };

  const formatCreationDate = (iso?: string) => {
    if (!iso) return "Yeni hesap";
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString("tr-TR")}`;
    } catch {
      return iso;
    }
  };

  // Realistic interactive theme cards
  const themes: Array<{
    id: NoteTheme;
    name: string;
    description: string;
    badge: string;
    mockup: React.ReactNode;
  }> = [
    {
      id: "clean",
      name: t.themeClean,
      description: "Temiz, dikkat dağıtmayan saf beyaz çalışma alanı.",
      badge: "Varsayılan",
      mockup: (
        <div className="w-full h-24 rounded-xl bg-white border border-zinc-200 p-2.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            <div className="w-8 h-1.5 rounded-full bg-zinc-200 ml-1" />
          </div>
          <div className="space-y-1.5">
            <div className="w-16 h-2 rounded bg-zinc-800" />
            <div className="w-full h-1.5 rounded bg-zinc-200/80" />
            <div className="w-4/5 h-1.5 rounded bg-zinc-200/60" />
          </div>
        </div>
      ),
    },
    {
      id: "dark",
      name: t.themeDark,
      description: "Göz yormayan, monokrom derin gece ve obsidian modu.",
      badge: "Koyu Mod",
      mockup: (
        <div className="w-full h-24 rounded-xl bg-[#09090b] border border-zinc-800 p-2.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            <div className="w-8 h-1.5 rounded-full bg-zinc-800 ml-1" />
          </div>
          <div className="space-y-1.5">
            <div className="w-16 h-2 rounded bg-zinc-100" />
            <div className="w-full h-1.5 rounded bg-zinc-700/80" />
            <div className="w-4/5 h-1.5 rounded bg-zinc-800" />
          </div>
        </div>
      ),
    },
    {
      id: "dots",
      name: t.themeDots,
      description: "Mühendislik ve eskiz defteri noktalı ızgara dokusu.",
      badge: "Teknik",
      mockup: (
        <div
          className="w-full h-24 rounded-xl bg-white border border-zinc-200 p-2.5 flex flex-col justify-between shadow-xs"
          style={{
            backgroundImage: "radial-gradient(#a1a1aa 1.2px, transparent 1.2px)",
            backgroundSize: "10px 10px",
          }}
        >
          <div className="flex items-center gap-1.5 border-b border-zinc-200/80 pb-1.5 bg-white/90 backdrop-blur-xs -m-2.5 p-2.5 rounded-t-xl mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <div className="w-8 h-1.5 rounded-full bg-zinc-300 ml-1" />
          </div>
          <div className="space-y-1.5 bg-white/85 p-1.5 rounded-lg border border-zinc-100 backdrop-blur-xs">
            <div className="w-16 h-2 rounded bg-zinc-800" />
            <div className="w-full h-1.5 rounded bg-zinc-300" />
          </div>
        </div>
      ),
    },
    {
      id: "lines",
      name: t.themeLines,
      description: "Klasik defter yatay çizgileriyle sade yazım hissi.",
      badge: "Çizgili",
      mockup: (
        <div
          className="w-full h-24 rounded-xl bg-white border border-zinc-200 p-2.5 flex flex-col justify-between shadow-xs"
          style={{
            backgroundImage: "linear-gradient(to bottom, transparent 11px, #e4e4e7 12px)",
            backgroundSize: "100% 12px",
          }}
        >
          <div className="flex items-center gap-1.5 border-b border-zinc-200 pb-1.5 bg-white/90 -m-2.5 p-2.5 rounded-t-xl mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <div className="w-8 h-1.5 rounded-full bg-zinc-300 ml-1" />
          </div>
          <div className="space-y-1.5 bg-white/90 p-1.5 rounded-lg border border-zinc-100">
            <div className="w-20 h-2 rounded bg-zinc-900" />
            <div className="w-full h-1.5 rounded bg-zinc-300" />
          </div>
        </div>
      ),
    },
    {
      id: "sepia",
      name: t.themeSepia,
      description: "Sıcak parşömen ve nostaljik kitap kağıdı tonu.",
      badge: "Sıcak",
      mockup: (
        <div className="w-full h-24 rounded-xl bg-[#fcf8ed] border border-[#e2d8c3] p-2.5 flex flex-col justify-between shadow-xs text-[#3e382d]">
          <div className="flex items-center gap-1.5 border-b border-[#e2d8c3] pb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#b3a895]" />
            <div className="w-8 h-1.5 rounded-full bg-[#d5cbba] ml-1" />
          </div>
          <div className="space-y-1.5">
            <div className="w-16 h-2 rounded bg-[#3e382d]" />
            <div className="w-full h-1.5 rounded bg-[#c5baa7]" />
            <div className="w-4/5 h-1.5 rounded bg-[#d5cbba]" />
          </div>
        </div>
      ),
    },
    {
      id: "glass",
      name: t.themeGlass,
      description: "Buzlu yarı saydam cam ve yağmur atmosferi.",
      badge: "Glass",
      mockup: (
        <div className="w-full h-24 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 p-2 flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />
          <div className="relative z-10 flex items-center gap-1.5 border-b border-white/20 pb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
            <div className="w-8 h-1.5 rounded-full bg-white/40 ml-1" />
          </div>
          <div className="relative z-10 space-y-1.5 bg-white/20 p-2 rounded-lg backdrop-blur-md border border-white/20">
            <div className="w-16 h-2 rounded bg-white" />
            <div className="w-full h-1.5 rounded bg-white/60" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafa] overflow-y-auto selection:bg-zinc-200 selection:text-zinc-900">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-200/80 px-4 sm:px-8 flex items-center justify-between bg-white/80 backdrop-blur-md select-none sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 text-xs font-semibold px-3 py-1.5 rounded-xl active:scale-[0.98] transition cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>{t.backToNotes}</span>
          </button>

          <span className="text-zinc-300">/</span>

          <span className="font-extrabold text-xs sm:text-sm tracking-tight text-zinc-900">
            {t.manageProfile}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>@{user.username}</span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="text-zinc-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-xl text-xs active:scale-[0.98] transition cursor-pointer font-medium"
          >
            {t.logout}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Section 1: Hero Identity Banner Card */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-xs relative">
          {/* Subtle Top Banner with Geometric Grid */}
          <div
            className="h-28 sm:h-32 w-full bg-gradient-to-r from-zinc-900 via-neutral-900 to-zinc-950 relative overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="bg-white/10 backdrop-blur-md text-white/90 border border-white/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                {user.role}
              </span>
            </div>
          </div>

          {/* User Row (Floating Avatar & Meta) */}
          <div className="px-5 sm:px-8 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              
              {/* Avatar Box */}
              <div className="flex items-end gap-4">
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold text-2xl overflow-hidden ring-4 ring-white shadow-md relative">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="uppercase tracking-wider font-mono text-2xl">
                        {user.username.slice(0, 2)}
                      </span>
                    )}

                    {avatarLoading && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-[11px] font-semibold">
                        Yükleniyor...
                      </div>
                    )}
                  </div>

                  {/* Camera Upload Trigger */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Fotoğrafı Değiştir"
                    className="absolute bottom-1 right-1 w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-white flex items-center justify-center shadow-md cursor-pointer active:scale-95 transition"
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

                <div className="pt-2 sm:pt-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                    @{user.username}
                  </h1>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    İz bırakmayan kişisel profil
                  </p>
                </div>
              </div>

              {/* Upload & Remove Actions */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                  tabIndex={-1}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl active:scale-[0.98] transition cursor-pointer shadow-xs disabled:opacity-50"
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
                  <span>{t.uploadPhoto}</span>
                </button>

                {user.avatar && (
                  <button
                    type="button"
                    onClick={() => uploadAvatarData(null)}
                    disabled={avatarLoading}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200/90 font-medium px-3 py-2 rounded-xl active:scale-[0.98] transition cursor-pointer"
                  >
                    {t.removePhoto}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-100">
              <div className="bg-zinc-50/80 rounded-xl p-3 border border-zinc-100">
                <span className="text-[11px] font-medium text-zinc-400 block">{t.totalNotes}</span>
                <span className="text-sm font-bold text-zinc-900">{user.noteCount ?? 0} aktif not</span>
              </div>
              <div className="bg-zinc-50/80 rounded-xl p-3 border border-zinc-100">
                <span className="text-[11px] font-medium text-zinc-400 block">{t.registeredOn}</span>
                <span className="text-sm font-bold text-zinc-900">{formatCreationDate(user.createdAt)}</span>
              </div>
              <div className="bg-zinc-50/80 rounded-xl p-3 border border-zinc-100 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-medium text-zinc-400 block">Hesap Tipi</span>
                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {user.role === "ADMIN" ? "Yönetici (Kalıcı)" : "Anonim & Uçucu"}
                </span>
              </div>
            </div>

            {/* Preset Avatars Bar */}
            <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-zinc-500 font-medium">Hızlı hazır simgeler:</span>
              <div className="flex items-center gap-2">
                {presetAvatars.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={`w-7 h-7 rounded-xl ${p.bg} flex items-center justify-center text-xs shadow-xs hover:scale-110 active:scale-95 transition cursor-pointer border border-white/20`}
                    title={`${p.label} simgesini kullan`}
                  >
                    <span className="text-white text-[11px] font-bold">
                      {p.id === "preset-ghost" ? "👻" : p.id === "preset-terminal" ? ">_" : p.id === "preset-diamond" ? "💎" : p.id === "preset-star" ? "✨" : "AA"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {avatarError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-2.5 text-xs text-red-600 font-medium">
                {avatarError}
              </div>
            )}

            {avatarSuccess && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-700 font-medium">
                {avatarSuccess}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Segmented Tabs Control */}
        <div className="flex items-center gap-1 bg-zinc-200/60 p-1 rounded-2xl select-none max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab("theme")}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "theme"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span>🎨</span>
            <span>{t.noteTheme}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "security"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span>🔒</span>
            <span>{t.changePassword}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "info"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span>🛡️</span>
            <span>Gizlilik</span>
          </button>
        </div>

        {/* TAB 1: NOTEPAD THEMES */}
        {activeTab === "theme" && (
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  {t.noteTheme}
                </h2>
                <p className="text-xs text-zinc-500">
                  Not düzenleyicinizin çalışma alanı arka plan dokusunu ve renk tonunu seçin.
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Seçili: <strong className="text-zinc-800">{currentTheme}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((th) => {
                const isSelected = currentTheme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => handleThemeSelect(th.id)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer active:scale-[0.98] relative ${
                      isSelected
                        ? "border-zinc-900 ring-2 ring-zinc-900/10 bg-zinc-50/70 shadow-sm"
                        : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/40"
                    }`}
                  >
                    {th.mockup}

                    <div className="pt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900">
                          {th.name}
                        </span>
                        {isSelected ? (
                          <span className="w-2 h-2 rounded-full bg-zinc-900" />
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-medium">{th.badge}</span>
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
        )}

        {/* TAB 2: PASSWORD & SECURITY */}
        {activeTab === "security" && (
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-150">
            <div className="border-b border-zinc-100 pb-4">
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                {t.changePassword}
              </h2>
              <p className="text-xs text-zinc-500">
                Hesabınızı korumak için en az 6 karakterli güçlü bir parola belirleyin.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              {passwordStatus.type === "error" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 font-medium">
                  {passwordStatus.message}
                </div>
              )}

              {passwordStatus.type === "success" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 font-medium">
                  {passwordStatus.message}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 block">
                  {t.currentPassword}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs cursor-pointer"
                  >
                    {showPassword ? "Gizle" : "Göster"}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 block">
                  {t.newPassword}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••• (en az 6 karakter)"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 block">
                  {t.confirmNewPassword}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passwordStatus.type === "loading"}
                className="bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white font-medium px-5 py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {passwordStatus.type === "loading" ? "Güncelleniyor..." : t.savePassword}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: PRIVACY & LEGAL */}
        {activeTab === "info" && (
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs animate-in fade-in duration-150">
            <div className="border-b border-zinc-100 pb-4">
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                Gizlilik ve Yasal Güvence
              </h2>
              <p className="text-xs text-zinc-500">
                notsuscato platformunun iz bırakmama ve otomatik imha prensipleri.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-600">
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                <span className="font-bold text-zinc-900 text-xs block">Sıfır Kişisel Veri</span>
                <p className="leading-relaxed">
                  Hesabınızda e-posta adresi, telefon numarası veya ad-soyad tutulmaz. Yalnızca kullanıcı adı ve şifrelenmiş parola hash&apos;i yer alır.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                <span className="font-bold text-zinc-900 text-xs block">Otomatik İmha (TTL)</span>
                <p className="leading-relaxed">
                  Belirlenen sürenin (2–24 saat) bitiminde notlar veritabanından kalıcı olarak silinir; yedekleme havuzlarında veya çöp kutusunda tutulmaz.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                <span className="font-bold text-zinc-900 text-xs block">Adli ve Dışa Aktarım</span>
                <p className="leading-relaxed">
                  Notlarınızı dilediğiniz zaman TXT veya ZIP olarak indirebilir, kendi cihazınızda bağımsız olarak arşivleyebilirsiniz.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                <span className="font-bold text-zinc-900 text-xs block">Kullanıcı Sorumluluğu</span>
                <p className="leading-relaxed">
                  {t.legalDisclaimer}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
