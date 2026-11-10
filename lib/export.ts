import JSZip from "jszip";

export interface DecryptedNote {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isShared?: boolean;
  shareId?: string | null;
  views?: number;
  createdIp?: string;
  userAgent?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

function formatFullDateTime(iso?: string): string {
  if (!iso) return "Bilinmiyor";
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString("tr-TR")} ${d.toLocaleTimeString("tr-TR")}`;
  } catch {
    return iso;
  }
}

function sanitizeFilename(name: string): string {
  return (name || "isimsiz")
    .trim()
    .replace(/[^\w\s-ğüşıöçĞÜŞİÖÇ]/gi, "_")
    .slice(0, 40) || "not";
}

export function exportNoteAsTxt(note: DecryptedNote) {
  const content = [
    `================================================================`,
    `BAŞLIK       : ${note.title || "İsimsiz"}`,
    `OLUŞTURULMA  : ${formatFullDateTime(note.createdAt)}`,
    `GÜNCELLENME  : ${formatFullDateTime(note.updatedAt)}`,
    `İMHA (BİTİŞ) : ${formatFullDateTime(note.expiresAt)}`,
    `IP ADRESİ    : ${note.createdIp || "127.0.0.1"}`,
    `CİHAZ BİLGİSİ: ${note.userAgent || "Bilinmiyor"}`,
    `================================================================`,
    ``,
    note.body,
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilename(note.title)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportNoteAsZip(note: DecryptedNote) {
  const zip = new JSZip();

  // 1. not.txt
  zip.file("not.txt", `# ${note.title || "İsimsiz"}\n\n${note.body}`);

  // 2. cihaz-ip-bilgileri.txt
  const metaText = [
    `NOT DETAYLARI VE ADLİ İZ BİLGİSİ`,
    `----------------------------------------`,
    `Not ID          : ${note.id}`,
    `Oluşturulma     : ${formatFullDateTime(note.createdAt)}`,
    `Güncellenme     : ${formatFullDateTime(note.updatedAt)}`,
    `İmha Saati      : ${formatFullDateTime(note.expiresAt)}`,
    `Kayıt IP        : ${note.createdIp || "127.0.0.1"}`,
    `Cihaz / Tarayıcı: ${note.userAgent || "Bilinmiyor"}`,
  ].join("\n");
  zip.file("cihaz-ip-bilgileri.txt", metaText);

  // 3. metadata.json
  const metaJson = JSON.stringify(
    {
      id: note.id,
      title: note.title,
      createdIp: note.createdIp,
      userAgent: note.userAgent,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      expiresAt: note.expiresAt,
    },
    null,
    2
  );
  zip.file("metadata.json", metaJson);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilename(note.title)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
