import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { noteSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const notes = await prisma.note.findMany({
    where: { userId: session.userId },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      titleCiphertext: true,
      bodyCiphertext: true,
      iv: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const rate = checkRateLimit(`note_create:${session.userId}:${ip}`, 60, 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: "Çok sık not oluşturuldu. Lütfen biraz bekleyin." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = noteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Geçersiz not verisi." },
        { status: 400 }
      );
    }

    const { titleCiphertext, bodyCiphertext, iv, isPinned } = parsed.data;

    const note = await prisma.note.create({
      data: {
        userId: session.userId,
        titleCiphertext,
        bodyCiphertext,
        iv,
        isPinned,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Not oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Sunucu hatası meydana geldi." },
      { status: 500 }
    );
  }
}

