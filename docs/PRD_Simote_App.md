# Product Requirements Document (PRD)
## Simote App

**Versi:** 1.0  
**Tanggal:** 18 Juni 2026  
**Status:** Draft  

---

## 1. Ringkasan Eksekutif

Simote adalah aplikasi manajemen berbasis web yang mobile-friendly, dirancang untuk memudahkan pengelolaan data dengan sistem multi-role (Admin dan User). Aplikasi ini mendukung pengelolaan konten dengan fitur trash (tempat sampah) yang memungkinkan restore data hingga 30 hari.

---

## 2. Tujuan Produk

- Menyediakan platform manajemen yang mudah digunakan di perangkat mobile maupun desktop
- Memberikan kontrol akses berbasis role (Admin & User)
- Menjamin keamanan data dengan soft-delete (trash) sebelum penghapusan permanen
- Memudahkan admin dalam mengelola akun pengguna

---

## 3. Pengguna (User Personas)

### 3.1 Admin
- Memiliki akses penuh ke seluruh fitur aplikasi
- Dapat mengelola akun pengguna (reset/ganti password user)
- Dapat melihat dan mengelola seluruh data termasuk trash
- Bertanggung jawab atas konfigurasi sistem

### 3.2 User (Pengguna Biasa)
- Akses terbatas sesuai hak yang diberikan
- Dapat mengelola data miliknya sendiri
- Dapat memindahkan item ke trash dan melakukan restore
- Tidak bisa mengakses panel admin

---

## 4. Fitur Utama

### 4.1 Autentikasi & Manajemen Akun

#### 4.1.1 Login
- Login menggunakan username/email dan password
- Session management dengan token (JWT atau session-based)
- Auto logout setelah periode tidak aktif
- **Tidak ada fitur lupa password** — reset password dilakukan oleh Admin

#### 4.1.2 Manajemen Password oleh Admin
- Admin dapat mereset atau mengganti password pengguna mana saja
- Admin dapat melihat daftar semua pengguna
- Admin dapat menonaktifkan/mengaktifkan akun pengguna
- Log aktivitas perubahan password tersimpan

#### 4.1.3 Ganti Password (User)
- User dapat mengganti password mereka sendiri melalui halaman profil
- Wajib memasukkan password lama sebelum mengganti ke yang baru
- Validasi kekuatan password (minimal 8 karakter)

---

### 4.2 Sistem Role & Akses

| Fitur | Admin | User |
|-------|-------|------|
| Login | ✅ | ✅ |
| Kelola data sendiri | ✅ | ✅ |
| Kelola data semua user | ✅ | ❌ |
| Reset password user lain | ✅ | ❌ |
| Akses panel admin | ✅ | ❌ |
| Lihat semua trash | ✅ | ❌ |
| Restore item sendiri dari trash | ✅ | ✅ |
| Hapus permanen | ✅ | ❌ |
| Manajemen user (tambah/nonaktifkan) | ✅ | ❌ |

---

### 4.3 Fitur Trash (Tempat Sampah)

#### 4.3.1 Soft Delete
- Semua penghapusan data bersifat soft-delete (dipindahkan ke trash)
- Item yang dihapus **tidak langsung hilang** dari sistem
- Item di trash tetap tersimpan selama **30 hari**

#### 4.3.2 Restore
- User dapat merestore item miliknya dari trash kapan saja selama 30 hari
- Admin dapat merestore item milik siapapun
- Item yang direstore kembali ke lokasi/status semula

#### 4.3.3 Auto Purge
- Item yang sudah berada di trash lebih dari **30 hari** akan dihapus permanen secara otomatis
- Sistem menjalankan scheduled job harian untuk membersihkan item kadaluarsa
- User mendapat notifikasi (opsional) beberapa hari sebelum item dihapus permanen

#### 4.3.4 Tampilan Trash
- Menampilkan daftar item yang dihapus beserta:
  - Nama/judul item
  - Tanggal dihapus
  - Sisa hari sebelum dihapus permanen
  - Tombol Restore
- Admin dapat melihat trash semua user
- User hanya melihat trash miliknya sendiri

---

### 4.4 Mobile-Friendly / Responsive Design

- Desain mengutamakan tampilan mobile (mobile-first approach)
- Breakpoint responsive:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- Navigasi menggunakan bottom navigation bar di mobile
- Tombol dan elemen interaktif berukuran minimal 44x44px (touch target)
- Tidak ada horizontal scroll pada konten utama
- Formulir input dioptimalkan untuk keyboard mobile
- Gambar dan aset dioptimalkan untuk loading cepat di mobile

---

### 4.5 Dashboard

#### Admin Dashboard
- Ringkasan statistik: total user, total data, item di trash
- Aktivitas terbaru
- Shortcut ke manajemen user
- Alert untuk item trash yang akan expired

#### User Dashboard
- Ringkasan data milik user
- Item terbaru
- Notifikasi item di trash yang akan expired

---

## 5. Alur Pengguna (User Flows)

### 5.1 Login Flow
```
Buka App → Halaman Login → Masukkan Kredensial → Validasi
  ├── Berhasil → Redirect ke Dashboard (sesuai role)
  └── Gagal → Tampilkan pesan error → Coba lagi
```

### 5.2 Delete & Restore Flow
```
User pilih item → Klik Hapus → Konfirmasi → Item masuk Trash
  └── Di halaman Trash:
       ├── Klik Restore → Item kembali ke semula
       └── Tunggu 30 hari → Terhapus permanen otomatis
```

### 5.3 Admin Reset Password Flow
```
Admin → Panel Admin → Daftar User → Pilih User
  → Klik "Reset Password" → Input password baru → Konfirmasi
  → Password user berhasil diubah → Notifikasi ke user (opsional)
```

---

## 6. Persyaratan Non-Fungsional

### 6.1 Performa
- Halaman pertama (LCP) load dalam < 3 detik pada koneksi 4G
- API response time < 500ms untuk operasi umum
- Support minimal 100 concurrent users

### 6.2 Keamanan
- Password di-hash menggunakan bcrypt (min cost factor 10)
- Autentikasi menggunakan JWT dengan expiry time
- HTTPS wajib di production
- Rate limiting pada endpoint login (max 5 percobaan/menit)
- Input sanitization untuk mencegah XSS dan SQL Injection
- Role-based access control (RBAC) di sisi server

### 6.3 Ketersediaan
- Uptime target: 99.5%
- Backup data harian

### 6.4 Kompatibilitas Browser
- Chrome (mobile & desktop) — versi 2 terbaru
- Safari (iOS & macOS) — versi 2 terbaru
- Firefox — versi 2 terbaru
- Samsung Internet

---

## 7. Tech Stack (Rekomendasi)

### Frontend
- **Framework:** Next.js / React (atau Vue.js)
- **Styling:** Tailwind CSS (mobile-first)
- **State Management:** Zustand / React Query

### Backend
- **Runtime:** Node.js / Go
- **Framework:** Express.js / Fastify / Fiber
- **Auth:** JWT

### Database
- **Primary:** PostgreSQL / MySQL
- **ORM:** Prisma / Drizzle

### Infrastructure
- **Hosting:** VPS / Railway / Vercel + Supabase
- **Scheduled Jobs:** Cron job untuk auto-purge trash

---

## 8. Struktur Database (Ringkasan)

### Tabel `users`
| Field | Type | Keterangan |
|-------|------|------------|
| id | UUID | Primary key |
| name | VARCHAR | Nama lengkap |
| email | VARCHAR | Unique |
| password_hash | VARCHAR | Bcrypt hash |
| role | ENUM | 'admin' / 'user' |
| is_active | BOOLEAN | Status akun |
| created_at | TIMESTAMP | - |
| updated_at | TIMESTAMP | - |

### Tabel `trash_items`
| Field | Type | Keterangan |
|-------|------|------------|
| id | UUID | Primary key |
| original_table | VARCHAR | Nama tabel asal |
| original_id | UUID | ID item asli |
| deleted_by | UUID | FK ke users |
| deleted_at | TIMESTAMP | Waktu dihapus |
| expires_at | TIMESTAMP | deleted_at + 30 hari |
| is_restored | BOOLEAN | Status restore |

---

## 9. Out of Scope (Tidak Termasuk)

- Fitur lupa password / forgot password
- Registrasi mandiri oleh user baru (akun dibuat oleh admin)
- Notifikasi email (opsional, bisa ditambahkan di versi berikutnya)
- Aplikasi native Android/iOS (cukup PWA / web mobile-friendly)
- Multi-tenant / multi-organisasi (versi 1.0)

---

## 10. Milestones & Prioritas

| Milestone | Fitur | Prioritas |
|-----------|-------|-----------|
| M1 | Autentikasi (login, logout, ganti password) | High |
| M1 | Sistem role Admin & User | High |
| M2 | CRUD data utama + mobile-friendly UI | High |
| M2 | Fitur Trash (soft-delete, restore, auto-purge) | High |
| M3 | Admin panel (manajemen user, reset password) | High |
| M4 | Dashboard & statistik | Medium |
| M5 | Notifikasi trash expiry | Low |

---

## 11. Kriteria Penerimaan (Acceptance Criteria)

### Login
- [ ] User bisa login dengan email + password yang valid
- [ ] Login gagal menampilkan pesan error yang jelas
- [ ] Tidak ada opsi "lupa password" di halaman login

### Role & Akses
- [ ] Admin bisa mengakses panel admin, user tidak bisa
- [ ] Admin bisa mengganti password user lain
- [ ] User hanya bisa mengelola data miliknya

### Trash
- [ ] Item yang dihapus masuk ke trash, bukan langsung hilang
- [ ] Item di trash menampilkan sisa waktu sebelum expired
- [ ] User bisa restore item dalam 30 hari
- [ ] Item otomatis terhapus permanen setelah 30 hari

### Mobile-Friendly
- [ ] Tampilan responsif di layar 375px (iPhone SE)
- [ ] Semua tombol mudah diklik di layar sentuh
- [ ] Tidak ada overflow horizontal

---

*Dokumen ini dibuat berdasarkan requirement awal dan dapat diperbarui seiring perkembangan proyek.*
