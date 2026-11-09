import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_THEMES = ["clean", "dark", "dots", "lines", "sepia", "glass"] as const;

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      role: true,
      avatar: true,
      theme: true,
      createdAt: true,
      _count: {
        select: { notes: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...user,
      noteCount: user._count.notes,
    },
  });
}

export async function PUT(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const rate = checkRateLimit(`profile:${session.userId}:${ip}`, 20, 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: `Çok fazla istek yapıldı. ${rate.resetInSec} saniye sonra tekrar deneyin.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { avatar, theme, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    const updateData: {
      avatar?: string | null;
      theme?: string;
      passwordHash?: string;
    } = {};

    // 1. Avatar update
    if (avatar !== undefined) {
      if (avatar === null || avatar === "") {
        updateData.avatar = null;
      } else if (typeof avatar === "string") {
        // Enforce max ~2.5MB payload size for avatar data URL
        if (avatar.length > 3_000_000) {
          return NextResponse.json(
            { error: "Profil fotoğrafı boyutu en fazla 2MB olabilir." },
            { status: 400 }
          );
        }
        if (!avatar.startsWith("data:image/") && !avatar.startsWith("http")) {
          return NextResponse.json(
            { error: "Geçersiz görsel formatı." },
            { status: 400 }
          );
        }
        updateData.avatar = avatar;
      }
    }

    // 2. Theme update
    if (theme !== undefined) {
      if (ALLOWED_THEMES.includes(theme)) {
        updateData.theme = theme;
      } else {
        return NextResponse.json(
          { error: "Geçersiz tema seçimi." },
          { status: 400 }
        );
      }
    }

    // 3. Password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Şifrenizi değiştirmek için mevcut şifrenizi girmelisiniz." },
          { status: 400 }
        );
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: "Mevcut şifreniz hatalı." },
          { status: 400 }
        );
      }

      if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 100) {
        return NextResponse.json(
          { error: "Yeni şifre en az 6, en fazla 100 karakter olmalıdır." },
          { status: 400 }
        );
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        avatar: true,
        theme: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: newPassword ? "Profil ve şifre güncellendi." : "Profil güncellendi.",
    });
  } catch (err: unknown) {
    console.error("Profil güncelleme hatası:", err);
    return NextResponse.json(
      { error: "Güncelleme sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
