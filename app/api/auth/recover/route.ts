import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { recoverSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { signSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(`recover:${ip}`, 3, 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: `Çok fazla deneme yapıldı. ${rate.resetInSec} saniye sonra tekrar deneyin.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = recoverSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 }
      );
    }

    const { username, recoveryKey, newPassword, newClientSalt } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!user || !user.recoveryKeyHash) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı veya kurtarma anahtarı tanımlanmamış." },
        { status: 404 }
      );
    }

    // SHA-256 hash hesapla
    const keyHash = createHash("sha256").update(recoveryKey).digest("hex");

    if (keyHash !== user.recoveryKeyHash) {
      return NextResponse.json(
        { error: "Geçersiz kurtarma anahtarı." },
        { status: 401 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Eski şifreyle şifrelenmiş notlar matematiksel olarak çözülemez hale geleceğinden silinir
    await prisma.$transaction([
      prisma.note.deleteMany({
        where: { userId: user.id },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          clientSalt: newClientSalt,
          recoveryKeyHash: null, // Kullanılan kurtarma anahtarını tüket
        },
      }),
    ]);

    const token = await signSession({
      userId: user.id,
      username: user.username,
    });

    const response = NextResponse.json({
      success: true,
      message: "Hesap başarıyla kurtarıldı. Eski şifreli notlar sıfırlandı.",
      user: {
        id: user.id,
        username: user.username,
        clientSalt: newClientSalt,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Kurtarma hatası:", error);
    return NextResponse.json(
      { error: "Sunucu hatası meydana geldi." },
      { status: 500 }
    );
  }
}

