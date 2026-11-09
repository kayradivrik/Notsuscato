import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { noteSchema } from "@/lib/validations";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = noteSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 }
      );
    }

    const existingNote = await prisma.note.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const isAdmin = session.role === "ADMIN" || session.username === "admin";
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.body !== undefined) updateData.body = parsed.data.body;
    if (parsed.data.isPinned !== undefined) updateData.isPinned = parsed.data.isPinned;
    if (parsed.data.expiresInHours !== undefined) {
      updateData.expiresAt = isAdmin
        ? null
        : new Date(Date.now() + parsed.data.expiresInHours * 60 * 60 * 1000);
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error("Not güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Sunucu hatası meydana geldi." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;

  // Normal kullanıcı kendi notunu, ADMIN ise herhangi bir notu silebilir
  const whereCondition =
    session.role === "ADMIN" ? { id } : { id, userId: session.userId };

  const existingNote = await prisma.note.findFirst({
    where: whereCondition,
  });

  if (!existingNote) {
    return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
  }

  await prisma.note.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
