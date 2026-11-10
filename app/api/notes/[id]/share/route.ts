import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const note = await prisma.note.findFirst({
      where: session.role === "ADMIN" ? { id } : { id, userId: session.userId },
    });

    if (!note) {
      return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
    }

    // Check if expired
    if (note.expiresAt && note.expiresAt <= new Date()) {
      return NextResponse.json({ error: "Süresi dolmuş not paylaşılamaz." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const shouldEnable = body.enabled !== undefined ? Boolean(body.enabled) : !note.isShared;

    let shareId = note.shareId;
    if (shouldEnable && !shareId) {
      shareId = crypto.randomBytes(6).toString("hex");
    }

    const updated = await prisma.note.update({
      where: { id },
      data: {
        isShared: shouldEnable,
        shareId: shareId,
      },
      select: {
        id: true,
        isShared: true,
        shareId: true,
        views: true,
      },
    });

    return NextResponse.json({
      success: true,
      isShared: updated.isShared,
      shareId: updated.shareId,
      views: updated.views,
    });
  } catch (error) {
    console.error("Not paylaşma hatası:", error);
    return NextResponse.json({ error: "İşlem başarısız oldu." }, { status: 500 });
  }
}

