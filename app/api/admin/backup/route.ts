import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yönetici yetkisi gerekli." }, { status: 403 });
  }

  try {
    const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `notsuscato_backup_${dateStr}.db`;

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/x-sqlite3",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      });
    }

    // Cloud Database (PostgreSQL / Supabase): Export clean JSON backup
    const [notes, users, reports] = await Promise.all([
      prisma.note.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          lastIp: true,
          userAgent: true,
          createdAt: true,
        },
      }),
      prisma.abuseReport.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    const backupData = JSON.stringify(
      {
        appName: "notsuscato",
        exportDate: new Date().toISOString(),
        database: "postgresql",
        stats: {
          totalUsers: users.length,
          totalNotes: notes.length,
          totalReports: reports.length,
        },
        users,
        notes,
        reports,
      },
      null,
      2
    );

    const dateStr = new Date().toISOString().slice(0, 10);
    return new NextResponse(backupData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="notsuscato_backup_${dateStr}.json"`,
      },
    });
  } catch (error) {
    console.error("Yedek indirme hatası:", error);
    return NextResponse.json({ error: "Yedek alınamadı." }, { status: 500 });
  }
}

