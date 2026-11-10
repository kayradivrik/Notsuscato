import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Look up note by shareId or direct id if isShared is true
    const note = await prisma.note.findFirst({
      where: {
        OR: [
          { shareId: id, isShared: true },
          { id: id, isShared: true },
        ],
      },
      include: {
        user: {
          select: {
            role: true,
            username: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Not bulunamadı veya paylaşımı kapatılmış." },
        { status: 404 }
      );
    }

    // Check expiration
    const isOwnerAdmin = note.user.role === "ADMIN" || note.user.username === "admin";
    if (!isOwnerAdmin && note.expiresAt && note.expiresAt <= new Date()) {
      // Purge expired note immediately
      await prisma.note.delete({ where: { id: note.id } }).catch(() => {});
      return NextResponse.json(
        { error: "Bu notun süresi doldu ve kalıcı olarak imha edildi.", expired: true },
        { status: 410 }
      );
    }

    // Increment view count
    await prisma.note.update({
      where: { id: note.id },
      data: { views: { increment: 1 } },
    }).catch(() => {});

    return NextResponse.json({
      title: note.title,
      body: note.body,
      createdAt: note.createdAt,
      expiresAt: note.expiresAt,
      views: note.views + 1,
      isPermanent: !note.expiresAt,
    });
  } catch (error) {
    console.error("Paylaşılan not getirme hatası:", error);
    return NextResponse.json(
      { error: "Not getirilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
