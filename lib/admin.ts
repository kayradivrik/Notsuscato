import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "kayrakuzeyelektrogitar";

export async function ensureAdminUser() {
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
      const isMatch = await bcrypt.compare(ADMIN_PASSWORD, existing.passwordHash);
      if (!isMatch || existing.role !== "ADMIN") {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            role: "ADMIN",
            passwordHash,
          },
        });
        console.log("Admin şifresi güncellendi.");
      }
    }
  } catch (error) {
    console.error("Admin kullanıcısı doğrulanırken hata:", error);
  }
}

