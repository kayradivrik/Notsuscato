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

    const updatedNote = await prisma.note.update({
      where: { id },
      data: parsed.data,
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

  const existingNote = await prisma.note.findFirst({
    where: { id, userId: session.userId },
  });

  if (!existingNote) {
    return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
  }

  await prisma.note.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

