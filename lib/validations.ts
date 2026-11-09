import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır.")
    .max(30, "Kullanıcı adı en fazla 30 karakter olabilir.")
    .regex(/^[a-zA-Z0-9_-]+$/, "Kullanıcı adı yalnızca harf, rakam, tire ve alt çizgi içerebilir."),
  password: z
    .string()
    .min(8, "Parola en az 8 karakter olmalıdır.")
    .max(128, "Parola en fazla 128 karakter olabilir."),
  adminKey: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Kullanıcı adı girilmelidir."),
  password: z.string().min(1, "Parola girilmelidir."),
});

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Başlık boş olamaz.").max(120, "Başlık en fazla 120 karakter olabilir."),
  body: z.string().max(50_000, "Not içeriği en fazla 50.000 karakter olabilir.").default(""),
  isPinned: z.boolean().default(false),
  expiresInHours: z.number().min(1).max(24).optional().default(24),
});
