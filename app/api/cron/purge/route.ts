import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  return handlePurge(req);
}

export async function POST(req: NextRequest) {
  return handlePurge(req);
}

async function handlePurge(req: NextRequest) {
  // If CRON_SECRET is configured in env, require bearer token authentication
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();

    // Süresi dolmuş tüm notları sil (Admin notları asla silinmez)
    const result = await prisma.note.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
        user: {
          role: { not: "ADMIN" },
          username: { not: "admin" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      purgedCount: result.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron purge error:", error);
    return NextResponse.json(
      { error: "Purge execution failed." },
      { status: 500 }
    );
  }
}

