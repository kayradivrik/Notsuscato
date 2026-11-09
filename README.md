# Notsuscato

Minimal, anonymous, zero-knowledge end-to-end encrypted note-taking app.

- **Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Prisma (SQLite), Web Crypto API.
- **Security:** AES-GCM 256-bit client-side encryption, PBKDF2 key derivation, Argon2/bcrypt password hashing, IP rate limiting.
- **Zero-Knowledge:** Notes are encrypted in the browser before transmission; the server stores only ciphertext and IV.
