import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yönetici yetkisi gerekli." }, { status: 403 });
  }

  try {
    const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: "Veritabanı dosyası bulunamadı." }, { status: 404 });
    }

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
  } catch (error) {
    console.error("Yedek indirme hatası:", error);
    return NextResponse.json({ error: "Yedek alınamadı." }, { status: 500 });
  }
}

