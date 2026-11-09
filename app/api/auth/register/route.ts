import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { signSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "Bilinmiyor";
  const rate = checkRateLimit(`register:${ip}`, 5, 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: `Çok fazla istek. Lütfen ${rate.resetInSec} saniye bekleyin.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 }
      );
    }

    const { username, password, adminKey } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı zaten alınmış." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Yönetici kontrolü
    const isAdmin =
      (adminKey && process.env.ADMIN_SECRET_KEY && adminKey === process.env.ADMIN_SECRET_KEY) ||
      username.toLowerCase() === "admin";

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        passwordHash,
        role: isAdmin ? "ADMIN" : "USER",
        lastIp: ip,
        userAgent,
      },
    });

    const token = await signSession({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: { id: user.id, username: user.username, role: user.role },
      },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Kayıt hatası:", error);
    return NextResponse.json(
      { error: "Sunucu hatası meydana geldi." },
      { status: 500 }
    );
  }
}
