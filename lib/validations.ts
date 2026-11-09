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
  clientSalt: z
    .string()
    .min(16, "Geçersiz şifreleme tuzu (salt).")
    .max(128),
  recoveryKeyHash: z
    .string()
    .length(64, "Geçersiz kurtarma anahtarı hash'i.")
    .optional(),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Kullanıcı adı girilmelidir."),
  password: z.string().min(1, "Parola girilmelidir."),
});

export const recoverSchema = z.object({
  username: z.string().trim().min(1, "Kullanıcı adı girilmelidir."),
  recoveryKey: z.string().trim().length(64, "Kurtarma anahtarı 64 karakterli hex formatında olmalıdır."),
  newPassword: z.string().min(8, "Yeni parola en az 8 karakter olmalıdır.").max(128),
  newClientSalt: z.string().min(16),
});

export const noteSchema = z.object({
  titleCiphertext: z.string().min(1, "Başlık verisi boş olamaz."),
  bodyCiphertext: z.string().default(""),
  iv: z.string().min(12, "Geçersiz IV (Initialization Vector)."),
  isPinned: z.boolean().default(false),
});

