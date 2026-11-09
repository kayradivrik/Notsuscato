import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "banayalansoyledilerkaderdenbahsetmediler";

let isEnsured = false;

export async function ensureAdminUser() {
  if (isEnsured) return;

  try {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const existing = await prisma.user.findUnique({
      where: { username: ADMIN_USERNAME },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          username: ADMIN_USERNAME,
          passwordHash,
          role: "ADMIN",
        },
      });
      console.log("Admin kullanıcısı başarıyla oluşturuldu.");
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: "ADMIN",
          passwordHash,
        },
      });
    }

    isEnsured = true;
  } catch (error) {
    console.error("Admin kullanıcısı doğrulanırken hata:", error);
  }
}

