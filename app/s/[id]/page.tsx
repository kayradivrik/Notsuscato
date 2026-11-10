"use client";

import { use, useState, useEffect, Suspense } from "react";
import Link from "next/link";

interface SharedNoteData {
  title: string;
  body: string;
  createdAt: string;
  expiresAt: string | null;
  views: number;
  isPermanent: boolean;
}

function SharedNoteContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<SharedNoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("Yasa dışı içerik");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    async function loadNote() {
      try {
        const res = await fetch(`/api/s/${id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 410 || errData.expired) {
            setIsExpired(true);
          } else {
            setError(errData.error || "Not bulunamadı veya paylaşımı sonlandırılmış.");
          }
          return;
        }

        const note = await res.json();
        setData(note);
      } catch (err) {
        console.error(err);
        setError("Not yüklenirken bir bağlantı hatası oluştu.");
      } finally {
        setLoading(false);
      }
    }

    loadNote();
  }, [id]);

  // Live countdown timer
  useEffect(() => {
    if (!data || !data.expiresAt) return;

    const updateCountdown = () => {
      const now = Date.now();
      const exp = new Date(data.expiresAt!).getTime();
      const diff = exp - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("Süresi doldu");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, "0");
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data]);

  const handleCopy = async () => {
    if (!data) return;
    const textToCopy = `${data.title}\n\n${data.body}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);
    try {
      const res = await fetch(`/api/s/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails,
        }),
      });

      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccess(false);
          setReportDetails("");
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-zinc-500 font-sans">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zinc-900 animate-ping" />
          <span className="text-sm font-medium">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4 text-zinc-400">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-zinc-900 mb-2">Bu Not İmha Edildi</h1>
        <p className="text-sm text-zinc-500 max-w-md mb-6 leading-relaxed">
          Belirlenen geçerlilik süresi sona erdiği için bu not sunuculardan kalıcı olarak silinmiştir ve kurtarılamaz.
        </p>
        <Link
          href="/"
          className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm active:scale-95"
        >
          Kendi Notunu Oluştur
        </Link>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4 text-red-500">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-zinc-900 mb-2">Not Bulunamadı</h1>
        <p className="text-sm text-zinc-500 max-w-md mb-6">
          {error || "Bu bağlantı geçersiz veya notun paylaşımı kapatılmış."}
        </p>
        <Link
          href="/"
          className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm active:scale-95"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 flex flex-col font-sans selection:bg-zinc-200 selection:text-zinc-900">
      {/* Navigation Bar */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-extrabold text-base tracking-tight text-zinc-900 flex items-center gap-1">
            <span>notsuscato</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 inline-block mb-1" />
          </Link>
          <span className="hidden sm:inline-block text-[11px] font-medium text-zinc-400 border-l border-zinc-200 pl-3">
            Salt Okunur Not
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {data.expiresAt ? (
            <div
              title="Kalan geçerlilik süresi"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70 text-xs font-mono font-semibold"
            >
              <svg className="w-3.5 h-3.5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
              <span>{timeLeft}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-medium">
              <span className="text-emerald-500 font-bold">∞</span>
              <span>Kalıcı Not</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition active:scale-95 cursor-pointer shadow-sm"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Kopyalandı!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Kopyala</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-5 sm:px-8 py-8 sm:py-14">
        <article className="bg-white rounded-2xl border border-zinc-200/90 p-6 sm:p-10 shadow-sm">
          <div className="border-b border-zinc-100 pb-5 mb-6 flex items-start justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 leading-tight">
              {data.title || "İsimsiz Not"}
            </h1>
          </div>

          <div className="prose prose-zinc max-w-none text-zinc-800 leading-relaxed font-normal whitespace-pre-wrap text-sm sm:text-base break-words">
            {data.body || <span className="text-zinc-400 italic">Not içeriği boş.</span>}
          </div>

          <div className="mt-12 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-400 gap-3">
            <div className="flex items-center gap-3">
              <span>{new Date(data.createdAt).toLocaleDateString("tr-TR")}</span>
              <span>•</span>
              <span>{data.views} kez görüntülendi</span>
            </div>

            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="text-zinc-400 hover:text-red-500 transition text-xs font-medium flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              <span>Kötüye Kullanım Bildir</span>
            </button>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 py-6 text-center text-xs text-zinc-400">
        <p className="max-w-md mx-auto px-4">
          Bu not <Link href="/" className="font-semibold text-zinc-700 hover:underline">notsuscato</Link> ile güvenli ve geçici olarak oluşturulmuştur. Süre dolduğunda kalıcı olarak imha edilir.
        </p>
      </footer>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-zinc-900 mb-1">Kötüye Kullanım Bildir</h2>
            <p className="text-xs text-zinc-500 mb-4">
              Bu not yasa dışı, telif hakkı ihlali veya zararlı içerik barındırıyorsa incelememiz için bildirebilirsiniz.
            </p>

            {reportSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 text-center font-medium">
                Bildiriminiz yetkililere iletildi. İnceleme başlatıldı.
              </div>
            ) : (
              <form onSubmit={handleSendReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Bildirim Nedeni
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  >
                    <option value="Yasa dışı içerik">Yasa dışı içerik</option>
                    <option value="Kişisel bilgi / ifşa (doxxing)">Kişisel bilgi / ifşa (doxxing)</option>
                    <option value="Spam / Zararlı yazılım / Kimlik avı">Spam / Zararlı yazılım / Kimlik avı</option>
                    <option value="Telif hakkı ihlali">Telif hakkı ihlali</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Gerekirse kısa detay ekleyin..."
                    className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={reportSubmitting}
                    onClick={() => setShowReportModal(false)}
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-800 px-3 py-2 rounded-xl transition"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {reportSubmitting ? "Gönderiliyor..." : "Bildirimi Gönder"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SharedNotePage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-zinc-500 font-sans">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-zinc-900 animate-ping" />
            <span className="text-sm font-medium">Yükleniyor...</span>
          </div>
        </div>
      }
    >
      <SharedNoteContent params={props.params} />
    </Suspense>
  );
}
