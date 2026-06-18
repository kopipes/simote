# Simote

Aplikasi web untuk menyimpan catatan pribadi dan kredensial secara aman — SSH, login/password, API keys, dan catatan teks biasa. Dibangun untuk individu atau tim kecil yang butuh tempat penyimpanan terpusat yang cepat dan aman.

## Fitur

- **4 tipe catatan** — Login/Password, SSH Credential, API Provider, Catatan Teks
- **Enkripsi AES-256** — semua field sensitif (password, private key, API key) dienkripsi sebelum disimpan
- **Masking otomatis** — field sensitif tampil sebagai `••••••••` secara default, bisa di-reveal per field
- **Copy 1 klik** — copy per field atau "Copy Keduanya" (username + password)
- **Search real-time** — cari berdasarkan judul, isi, atau kategori dengan debounce 250ms
- **Kategori warna** — buat kategori dengan warna kustom, filter sidebar
- **Trash 30 hari** — soft delete dengan restore, auto-purge setelah 30 hari, bulk select & delete
- **Multi-user** — setiap user punya data privat masing-masing
- **Admin panel** — kelola user, reset/ganti password, aktifkan/nonaktifkan akun
- **Mobile-friendly** — layout responsif, bottom sheet modal di mobile

## Tech Stack

- **Frontend/Backend** — Next.js 16 (App Router, TypeScript)
- **Database** — SQLite via Prisma ORM
- **Auth** — JWT (HttpOnly cookie), bcrypt password hashing
- **Styling** — Tailwind CSS v4
- **Icons** — Lucide React

## Instalasi

### Prerequisites

- Node.js 20.9+
- npm

### Setup

```bash
# Clone repo
git clone https://github.com/kopipes/simote.git
cd simote

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dan isi nilai yang diperlukan

# Inisialisasi database
npx prisma db push

# Buat admin user pertama
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### Environment Variables

Buat file `.env` di root project:

```env
# Path ke SQLite database
DATABASE_URL="file:./prisma/dev.db"

# Secret untuk signing JWT — gunakan random string yang panjang
JWT_SECRET="your-very-secret-jwt-key-change-this"

# Encryption key untuk field sensitif — gunakan random string 32+ karakter
ENCRYPTION_KEY="your-32-char-encryption-key-here"
```

> **Penting:** Jangan commit file `.env`. Gunakan nilai yang kuat dan unik di production.

## Akun Default

Setelah menjalankan seed:

| Field | Value |
|-------|-------|
| Email | `admin@simote.app` |
| Username | `admin` |
| Password | `admin1234` |
| Role | Admin |

Segera ganti password setelah pertama kali login.

## Struktur Project

```
src/
├── app/
│   ├── (auth)/          # Login & Register pages
│   ├── (protected)/     # Dashboard, Trash, Admin (requires auth)
│   └── api/             # API routes
├── components/         # UI components
├── context/            # AuthContext
├── lib/                # Prisma client, auth, encryption, constants
└── middleware.ts       # JWT auth guard
prisma/
├── schema.prisma       # Database schema
└── seed.ts             # Seed admin user
```

## Build Production

```bash
npm run build
npm start
```

## Lisensi

MIT
