import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(`abuse_report:${ip}`, 5, 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: "Çok fazla bildirim gönderdiniz. Lütfen bir süre bekleyin." },
      { status: 429 }
    );
  }

  const { id } = await params;

  try {
    const note = await prisma.note.findFirst({
      where: {
        OR: [
          { shareId: id },
          { id: id },
        ],
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = (body.reason || "Kötüye Kullanım").toString().slice(0, 100);
    const details = body.details ? body.details.toString().slice(0, 500) : null;

    await prisma.abuseReport.create({
      data: {
        noteId: note.id,
        reason,
        details,
        ip,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bildiriminiz yetkililere iletildi. Teşekkür ederiz.",
    });
  } catch (error) {
    console.error("Şikayet gönderme hatası:", error);
    return NextResponse.json(
      { error: "Bildirim kaydedilirken hata oluştu." },
      { status: 500 }
    );
  }
}

