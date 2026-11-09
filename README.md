# Notsuscato

Minimal, anonymous, zero-knowledge end-to-end encrypted ephemeral note-taking app.

---

### Features

- **No Personal Data:** Only username & password. No email, phone, or OAuth.
- **Zero-Knowledge Architecture:** Client-side AES-GCM 256-bit encryption with PBKDF2 (SHA-256, 100k rounds). The server never sees the plain text or encryption keys.
- **Self-Destructing Notes (TTL):** Notes automatically purge from the database after 2, 4, 6, 8, 12, or 24 hours.
- **Forensic Export (.txt & .zip):** Export active notes as plain text or as a `.zip` archive containing the note and ad-hoc metadata (creation time down to the second, expiration time, client IP, device user-agent).
- **Brutalist Monospace UI:** 2019-style retro minimalist dark interface (`#000000`), zero distractions, zero bloated SVG icons.
- **Security:** HTTP-Only session cookies (via `jose`), bcrypt salted password hashes, IP-based sliding window rate limiting.

---

### Getting Started

```bash
# 1. Clone repository
git clone https://github.com/kayradivrik/Notsuscato.git
cd Notsuscato

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Initialize SQLite Database
npm run db:push

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
