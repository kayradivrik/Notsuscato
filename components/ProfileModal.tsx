"use client";

import { useState, useRef } from "react";
import { Language, translations } from "@/lib/i18n";

export type NoteTheme = "clean" | "dark" | "dots" | "lines" | "sepia" | "glass";

export interface UserProfile {
  id: string;
  username: string;
  role: string;
  avatar?: string | null;
  theme?: string;
  createdAt?: string;
  noteCount?: number;
}

interface ProfileModalProps {
  user: UserProfile;
  lang: Language;
  onClose: () => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export function ProfileModal({
  user,
  lang,
  onClose,
  onUpdateUser,
}: ProfileModalProps) {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs: "general" (photo & theme) | "security" (password)
  const [activeTab, setActiveTab] = useState<"general" | "security">("general");

  // Avatar state
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  // Theme state
  const currentTheme = (user.theme as NoteTheme) || "clean";

  // Handle avatar upload via FileReader and canvas compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Görsel boyutu en fazla 5MB olabilir.");
      return;
    }

    setAvatarLoading(true);
    setAvatarError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        // Compress / resize to max 400x400 for optimal fast avatar storage
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

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

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setAvatarLoading(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        try {
          const res = await fetch("/api/user/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar: dataUrl }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Görsel kaydedilemedi.");

          onUpdateUser({ avatar: dataUrl });
        } catch (err: unknown) {
          setAvatarError(err instanceof Error ? err.message : "Yükleme hatası.");
        } finally {
          setAvatarLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      img.onerror = () => {
        setAvatarError("Görsel işlenemedi.");
        setAvatarLoading(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    setAvatarError(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Görsel kaldırılamadı.");
      onUpdateUser({ avatar: null });
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setAvatarLoading(false);
    }
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
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
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
    bgClass: string;
    preview: React.ReactNode;
  }> = [
    {
      id: "clean",
      name: t.themeClean,
      bgClass: "bg-[#fafafa]",
      preview: <div className="w-full h-8 rounded-md bg-white border border-zinc-200" />,
    },
    {
      id: "dark",
      name: t.themeDark,
      bgClass: "bg-[#09090b]",
      preview: <div className="w-full h-8 rounded-md bg-[#18181b] border border-zinc-800" />,
    },
    {
      id: "dots",
      name: t.themeDots,
      bgClass: "bg-[#fafafa]",
      preview: (
        <div
          className="w-full h-8 rounded-md bg-white border border-zinc-200"
          style={{
            backgroundImage: "radial-gradient(#a1a1aa 1px, transparent 1px)",
            backgroundSize: "6px 6px",
          }}
        />
      ),
    },
    {
      id: "lines",
      name: t.themeLines,
      bgClass: "bg-[#fafafa]",
      preview: (
        <div
          className="w-full h-8 rounded-md bg-white border border-zinc-200"
          style={{
            backgroundImage: "linear-gradient(to bottom, transparent 6px, #e4e4e7 7px)",
            backgroundSize: "100% 7px",
          }}
        />
      ),
    },
    {
      id: "sepia",
      name: t.themeSepia,
      bgClass: "bg-[#fcf8ed]",
      preview: <div className="w-full h-8 rounded-md bg-[#f4ecd8] border border-[#e2d5ba]" />,
    },
    {
      id: "glass",
      name: t.themeGlass,
      bgClass: "bg-zinc-100",
      preview: (
        <div className="w-full h-8 rounded-md bg-white/70 border border-zinc-200 backdrop-blur-xs flex items-center justify-center text-[10px] text-zinc-400">
          glass
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white border border-zinc-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-14 border-b border-zinc-100 px-6 flex items-center justify-between select-none bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 text-sm tracking-tight">
              {t.manageProfile}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 p-1.5 rounded-lg active:scale-95 transition cursor-pointer"
            title={t.close}
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-100 px-6 bg-zinc-50/30 gap-6 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-3 font-semibold border-b-2 transition cursor-pointer ${
              activeTab === "general"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-700"
            }`}
          >
            {t.profilePhoto} & {t.noteTheme}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`py-3 font-semibold border-b-2 transition cursor-pointer ${
              activeTab === "security"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-700"
            }`}
          >
            {t.changePassword}
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "general" ? (
            <>
              {/* Profile Avatar Card */}
              <div className="flex items-center gap-5 p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/40">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xl overflow-hidden border-2 border-zinc-200 shadow-xs">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="uppercase tracking-wider font-mono text-base">
                        {user.username.slice(0, 2)}
                      </span>
                    )}
                  </div>

                  {avatarLoading && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px]">
                      ...
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 text-sm truncate">
                      @{user.username}
                    </span>
                    <span className="bg-zinc-200/80 text-zinc-700 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase">
                      {user.role}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 font-normal">
                    {t.profilePhoto} ekleyerek profilinizi kişiselleştirin.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="avatar-upload-input"
                    />
                    <label
                      htmlFor="avatar-upload-input"
                      className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium px-3 py-1.5 rounded-xl active:scale-[0.98] transition cursor-pointer shadow-2xs"
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
                    </label>

                    {user.avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={avatarLoading}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200/60 font-medium px-2.5 py-1.5 rounded-xl active:scale-[0.98] transition cursor-pointer"
                      >
                        {t.removePhoto}
                      </button>
                    )}
                  </div>

                  {avatarError && (
                    <p className="text-[11px] text-red-600 font-medium pt-1">
                      {avatarError}
                    </p>
                  )}
                </div>
              </div>

              {/* Note Theme Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 tracking-tight">
                      {t.noteTheme}
                    </h4>
                    <p className="text-[11px] text-zinc-500 font-normal">
                      Not düzenleyicinizin çalışma alanı arka planını özelleştirin.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {themes.map((th) => {
                    const isSelected = currentTheme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => handleThemeSelect(th.id)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-2 transition cursor-pointer active:scale-[0.98] ${
                          isSelected
                            ? "border-zinc-900 ring-2 ring-zinc-900/10 bg-zinc-50 shadow-2xs"
                            : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
                        }`}
                      >
                        {th.preview}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-zinc-900 truncate">
                            {th.name}
                          </span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Change Password Form */
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm mx-auto py-2">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-900 tracking-tight">
                  {t.changePassword}
                </h4>
                <p className="text-[11px] text-zinc-500 font-normal">
                  Hesap güvenliğiniz için parolanızı istediğiniz zaman güncelleyebilirsiniz.
                </p>
              </div>

              {passwordStatus.type === "error" && (
                <div className="bg-red-50 border border-red-200/80 rounded-xl p-2.5 text-xs text-red-600 font-medium">
                  {passwordStatus.message}
                </div>
              )}

              {passwordStatus.type === "success" && (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 text-xs text-emerald-700 font-medium">
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
                className="w-full bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white font-medium py-2 rounded-xl text-xs shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-50 mt-2"
              >
                {passwordStatus.type === "loading" ? "Güncelleniyor..." : t.savePassword}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

