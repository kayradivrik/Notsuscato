import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "vault_session";
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-minimum-32-chars-long!!"
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Statik ve auth endpoint'lerini atla
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Korunan API rotaları için session kontrolü
  if (pathname.startsWith("/api/notes")) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Yetkisiz istek." }, { status: 401 });
    }

    try {
      await jwtVerify(token, SECRET);
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "Geçersiz oturum." }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
