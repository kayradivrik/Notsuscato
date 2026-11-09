"use client";

import { useState, useEffect } from "react";
import {
  deriveEncryptionKey,
  generateClientSalt,
  generateRecoveryKey,
} from "@/lib/crypto";

interface AuthModalProps {
  onSuccess: (user: { id: string; username: string }, key: CryptoKey) => void;
  unlockOnly?: { username: string; clientSalt: string };
  onCancelUnlock?: () => void;
}

export function AuthModal({ onSuccess, unlockOnly, onCancelUnlock }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState(unlockOnly ? unlockOnly.username : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [recoveryData, setRecoveryData] = useState<{ key: string; hash: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (isRegister && !recoveryData) {
      generateRecoveryKey().then((res) => {
        setRecoveryData({ key: res.recoveryKey, hash: res.hash });
      });
    }
  }, [isRegister, recoveryData]);

  const copyKey = () => {
    if (!recoveryData) return;
    navigator.clipboard.writeText(recoveryData.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (unlockOnly) {
        const cryptoKey = await deriveEncryptionKey(password, unlockOnly.clientSalt);
        sessionStorage.setItem("vault_pass_temp", password);
        onSuccess({ id: "", username: unlockOnly.username }, cryptoKey);
        return;
      }

      if (isRegister) {
        const clientSalt = generateClientSalt();
        const cryptoKey = await deriveEncryptionKey(password, clientSalt);

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            clientSalt,
            recoveryKeyHash: recoveryData?.hash,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Kayıt başarısız.");

        sessionStorage.setItem("vault_pass_temp", password);
        onSuccess(data.user, cryptoKey);
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Giriş başarısız.");

        const cryptoKey = await deriveEncryptionKey(password, data.user.clientSalt);
        sessionStorage.setItem("vault_pass_temp", password);
        onSuccess(data.user, cryptoKey);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 font-mono text-xs text-zinc-300">
      <div className="w-full max-w-xs border border-zinc-800 bg-zinc-950 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="font-bold text-zinc-100 uppercase tracking-wider">
            {unlockOnly ? "kilitli kasa" : "not defteri"}
          </span>
          {!unlockOnly && (
            <div className="flex gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className={`cursor-pointer ${!isRegister ? "text-zinc-100 underline" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                giriş
              </button>
              <span className="text-zinc-700">/</span>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className={`cursor-pointer ${isRegister ? "text-zinc-100 underline" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                kayıt
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="border border-red-900/50 bg-red-950/20 p-2 text-red-400 text-[11px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">kullanıcı adı</label>
            <input
              type="text"
              required
              disabled={!!unlockOnly || loading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-zinc-800 bg-black px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">şifre</label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-zinc-800 bg-black px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {isRegister && recoveryData && (
            <div className="border border-zinc-800/80 bg-zinc-900/40 p-2 space-y-1.5 text-[10px]">
              <div className="text-zinc-500">
                kurtarma kodu (şifreni unutursan tek çare):
              </div>
              <div className="break-all text-zinc-400 select-all font-mono">
                {recoveryData.key}
              </div>
              <button
                type="button"
                onClick={copyKey}
                className="text-zinc-300 hover:text-white underline cursor-pointer"
              >
                {copiedKey ? "kopyalandı" : "panoya kopyala"}
              </button>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            {unlockOnly && onCancelUnlock && (
              <button
                type="button"
                onClick={onCancelUnlock}
                className="border border-zinc-800 px-3 py-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition"
              >
                çıkış
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-500 transition disabled:opacity-50 font-medium"
            >
              {loading ? "..." : unlockOnly ? "kilidi aç" : isRegister ? "hesap aç" : "giriş yap"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
