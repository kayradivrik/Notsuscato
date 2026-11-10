import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yönetici yetkisi gerekli." }, { status: 403 });
  }

  // Süresi dolan notları temizle
  await prisma.note.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [notes, users, notesLast24hCount, reports] = await Promise.all([
    prisma.note.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        role: true,
        lastIp: true,
        userAgent: true,
        createdAt: true,
        _count: {
          select: { notes: true },
        },
      },
    }),
    prisma.note.count({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
    }),
    prisma.abuseReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        note: {
          select: {
            id: true,
            title: true,
            body: true,
            isShared: true,
            shareId: true,
            expiresAt: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      totalNotes: notes.length,
      totalUsers: users.length,
      notesLast24h: notesLast24hCount,
      totalReports: reports.length,
    },
    notes: notes.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      isPinned: n.isPinned,
      isShared: n.isShared,
      shareId: n.shareId,
      views: n.views,
      createdIp: n.createdIp,
      userAgent: n.userAgent,
      createdAt: n.createdAt,
      expiresAt: n.expiresAt,
      author: n.user.username,
      userId: n.userId,
    })),
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      lastIp: u.lastIp,
      userAgent: u.userAgent,
      createdAt: u.createdAt,
      noteCount: u._count.notes,
    })),
    reports: reports.map((r) => ({
      id: r.id,
      noteId: r.noteId,
      reason: r.reason,
      details: r.details,
      ip: r.ip,
      status: r.status,
      createdAt: r.createdAt,
      noteTitle: r.note?.title || "Silinmiş Not",
      noteAuthor: r.note?.user?.username || "Bilinmiyor",
      noteShared: r.note?.isShared || false,
      shareId: r.note?.shareId || null,
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yönetici yetkisi gerekli." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "note" veya "user"
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID belirtilmedi." }, { status: 400 });
  }

  if (type === "report") {
    await prisma.abuseReport.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Bildirim silindi." });
  }

  if (type === "note") {
    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Not silindi." });
  }

  if (type === "user") {
    // Admin kendi kendini silemesin ve ana admin silinemez
    if (id === session.userId) {
      return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz." }, { status: 400 });
    }
    const target = await prisma.user.findUnique({ where: { id } });
    if (target?.username === "admin") {
      return NextResponse.json({ error: "Ana yönetici hesabı silinemez." }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Kullanıcı ve notları silindi." });
  }

  return NextResponse.json({ error: "Geçersiz işlem tipi." }, { status: 400 });
}

