# Planning: Tenant Setup, User Setup, and Global App Launcher

## Ringkasan
Dokumen ini mendefinisikan rencana detail implementasi teknis untuk menambahkan fitur **Tenant Setup & Management (Landlord DB)**, **User Setup & Role Assignment (Tenant DB)**, serta **App Launcher Popup (Waffle Menu Overlay)** pada Next.js frontend dan Laravel backend. Fitur-fitur ini akan merampungkan pondasi IAM (Identity & Access Management) dan arsitektur visual platform.

## Referensi Dokumen
- PRD 1: [Foundation Architecture](file:///d:/HBM/Project/HRIS/docs/PRD/1.Foundation_Architecture.md)
- PRD 2: [Functional Modules](file:///d:/HBM/Project/HRIS/docs/PRD/2.Functional_Modules.md)
- Tenancy Middleware: [InitializeTenancy.php](file:///d:/HBM/Project/HRIS/apps/api/app/Http/Middleware/InitializeTenancy.php)

---

## Kondisi Existing (Current State)
- **Tenancy Database**: Skema PostgreSQL schema-per-tenant dikelola oleh package `stancl/tenancy`. Central/landlord DB memiliki tabel `tenants` dan `domains`.
- **Tenancy Setup**: Saat ini pendaftaran tenant hanya bisa dilakukan melalui seeder/seeding manual atau test suites. Belum ada API/UI untuk pendaftaran tenant baru.
- **User Setup**: Tabel `users` terisolasi per tenant schema. Seeder default membuat user `admin@nexushr.local` dengan role `Super Admin`. Belum ada API CRUD User dan UI User Management di tingkat tenant.
- **App Launcher**: Menu modul hanya tersedia sebagai grid statis di halaman `/dashboard`. Ketika user berada di halaman sub-modul (misal: `/training/master`), mereka harus menekan tombol "Back" ke dashboard terlebih dahulu sebelum bisa berpindah ke modul lain (seperti "Employees").

---

## Target Akhir (Desired State)
1. **Tenant Setup (Central DB)**:
   - Super Admin dapat mendaftarkan tenant baru melalui UI `/landlord` dengan memasukkan Nama dan Slug.
   - Pendaftaran tenant memicu pembuatan skema database otomatis, menjalankan migrasi tenant, dan men-seed data awal (Super Admin default).
   - Dilindungi menggunakan Token API Central (`X-Central-Token`) dari `.env` untuk keamanan landlord.
2. **User Setup (Tenant DB)**:
   - Tenant Admin / HR Manager dapat mengelola user (CRUD) di bawah sub-menu `/users`.
   - Admin dapat mengisi Nama, Email, Password, dan memilih Role (Super Admin, HR Manager, Employee) untuk user baru atau mengedit user yang ada.
   - User dinonaktifkan / dihapus secara aman menggunakan Laravel SoftDeletes.
3. **App Launcher Pop-up (Waffle Menu)**:
   - Sebuah waffle icon (grid icon) tersedia di pojok kiri atas/header setiap modul halaman.
   - Menekan tombol waffle akan memicu kemunculan Modal overlay modern (glassmorphism, animatif) berisi grid modul, memungkinkan navigasi instan antar-modul tanpa harus kembali ke dashboard utama.

---

## Rencana Implementasi

### Fase 1: Central Tenant Setup (Landlord Context)

#### Step 1.1: Backend Tenant API & Token Authentication
- **Modul**: Core (Landlord Domain)
- **File**: 
  - `apps/api/app/Http/Controllers/Landlord/TenantController.php` [NEW]
  - `apps/api/routes/api.php` [MODIFY]
- **Aksi**: CREATE / MODIFY
- **Detail**:
  - Buat `TenantController` di luar tenant middleware.
  - Implementasikan validasi token `X-Central-Token` yang dikonfigurasi melalui `.env` (`CENTRAL_API_KEY=nexus_central_secret`).
  - Endpoint `GET /api/v1/tenants`: Mengambil daftar tenant dari central DB beserta domainnya.
  - Endpoint `POST /api/v1/tenants`: Menerima `name` dan `slug` (unique, lowercase, alphanumeric). Membuat tenant dan domain `slug . '.local'`, memicu pembuatan schema, migrasi, dan seeder.
  - Endpoint `DELETE /api/v1/tenants/{id}`: Menghapus tenant dan mendrop skema databasenya.
- **Validasi**: Lakukan curl POST ke `/api/v1/tenants` dengan header `X-Central-Token` yang valid, verifikasi skema database baru berhasil dibuat.

#### Step 1.2: Frontend Landlord Page
- **Modul**: Frontend (Next.js)
- **File**:
  - `apps/web/src/app/landlord/page.tsx` [NEW]
- **Aksi**: CREATE
- **Detail**:
  - Halaman manajemen landlord utama di `/landlord`.
  - Meminta input **Central API Key** saat pertama kali dibuka (disimpan di `localStorage` / `sessionStorage`).
  - Menampilkan tabel daftar tenant: Nama Tenant, Slug, Domain, ID, Tanggal Dibuat.
  - Tombol **"Register Tenant"** membuka dialog modal untuk memasukkan Nama dan Slug.
  - Tombol **"Delete"** dengan dialog konfirmasi ganda untuk menghapus tenant.
  - Tombol **"Visit Dashboard"** yang mengarahkan ke halaman login tenant (`/login?tenant=slug`).
- **Validasi**: Verifikasi input API Key membatasi data, pendaftaran tenant langsung mengupdate tabel, dan redirect ke login berjalan mulus.

---

### Fase 2: Tenant User Setup (Tenant Context)

#### Step 2.1: Backend User CRUD & Role List Endpoints
- **Modul**: Core (Tenant Domain)
- **File**:
  - `apps/api/app/Http/Controllers/Tenant/UserController.php` [NEW]
  - `apps/api/app/Http/Controllers/Tenant/RoleController.php` [NEW]
  - `apps/api/routes/tenant.php` [MODIFY]
- **Aksi**: CREATE / MODIFY
- **Detail**:
  - Daftarkan route baru di `routes/tenant.php` di bawah middleware `auth:api` dan permission guards:
    - `Route::apiResource('users', UserController::class);`
    - `Route::get('roles', [RoleController::class, 'index']);`
  - `UserController` mengelola model `App\Models\User` dalam skema tenant aktif:
    - `index()`: Mengembalikan user terpaginasi beserta role-nya.
    - `store()`: Validasi nama, email, password, roles (array). Hashing password, simpan user, sync roles menggunakan Spatie `$user->assignRole($roles)`.
    - `update()`: Validasi nama, email, password (nullable), roles. Update model, sync roles menggunakan Spatie `$user->syncRoles($roles)`.
    - `destroy()`: Soft deletes user.
  - `RoleController` mengembalikan list role (`Role::all()`) agar bisa dirender sebagai pilihan checkbox/select di frontend.
- **Validasi**: Verifikasi CRUD user dan pemetaan role spatie di dalam tenant database berjalan lancar.

#### Step 2.2: Frontend User Management Page
- **Modul**: Frontend (Next.js)
- **File**:
  - `apps/web/src/app/users/page.tsx` [NEW]
  - `apps/web/src/app/dashboard/page.tsx` [MODIFY]
- **Aksi**: CREATE / MODIFY
- **Detail**:
  - Buat halaman User Management di `/users`.
  - Daftarkan card baru **"User Management"** pada dashboard launcher utama dengan deskripsi: *"Manage system access, create user accounts, and assign roles."* (Hanya ditampilkan untuk user berkewenangan admin/Super Admin/HR Manager).
  - Tampilkan data table: Nama, Email, Roles (displayed as nice colored badges), Tanggal Terdaftar, Actions.
  - Buat form modal **Add User** dan **Edit User** lengkap dengan field Nama, Email, Password, dan Checklist Role (Super Admin, HR Manager, Employee).
- **Validasi**: Buka halaman `/users`, tambahkan user baru, pastikan user tersimpan di DB tenant dan muncul di list table dengan role badge yang sesuai.

---

### Fase 3: App Launcher Pop-up (Waffle Menu Overlay)

#### Step 3.1: Shared Header Component with Waffle Launcher
- **Modul**: Frontend (Next.js)
- **File**:
  - `apps/web/src/components/Header.tsx` [NEW]
- **Aksi**: CREATE
- **Detail**:
  - Buat komponen Header terpadu yang dapat digunakan oleh semua modul.
  - Tampilkan:
    - Tombol Waffle (Grid icon / LayoutGrid dari Lucide) di pojok kiri.
    - Judul Modul dan Deskripsi halaman saat ini.
    - Tombol kembali (Back button) jika sedang berada di sub-halaman modul.
    - Panel kanan: Theme Toggle, User Profile Avatar, Logout.
  - Hubungkan tombol Waffle dengan State untuk memunculkan App Launcher Pop-up Overlay.

#### Step 3.2: Launcher Pop-up Overlay Modal
- **Modul**: Frontend (Next.js)
- **File**:
  - `apps/web/src/components/AppLauncherOverlay.tsx` [NEW]
- **Aksi**: CREATE
- **Detail**:
  - Buat overlay pop-up modal glassmorphism.
  - Rerender daftar modul (Organization, Employees, Attendance, Document, Recruitment, Training, Certification, User Management) dalam layout grid 3x3 yang kompak dan premium.
  - Dilengkapi hover animation zoom, glow borders, dan transisi smooth.
  - Menyediakan tombol penutup (X) atau menutup saat mengklik area luar modal.
  - Integrasikan keyboard shortcut `Ctrl + K` (atau `Cmd + K`) untuk memicu pop-up launcher ini secara cepat.

#### Step 3.3: Refactor Module Headers
- **Modul**: Frontend (Next.js)
- **File**:
  - `apps/web/src/app/organization/page.tsx` [MODIFY]
  - `apps/web/src/app/employees/page.tsx` [MODIFY]
  - `apps/web/src/app/attendance-leave/page.tsx` [MODIFY]
  - `apps/web/src/app/documents-reports/page.tsx` [MODIFY]
  - `apps/web/src/app/recruitment/page.tsx` [MODIFY]
  - `apps/web/src/app/training/page.tsx` [MODIFY]
  - `apps/web/src/app/certification/page.tsx` [MODIFY]
- **Aksi**: MODIFY
- **Detail**:
  - Ganti kode header lokal pada masing-masing modul landing page dengan memanggil komponen `<Header title="..." subtitle="..." />` terpadu.
- **Validasi**: Uji perpindahan halaman menggunakan tombol waffle launcher dari modul satu ke modul lainnya (misal: Training langsung ke Employees) dan verifikasi responnya instan dan bebas lag.

---

## Rencana Verifikasi (Verification Plan)

### Automated Tests (Backend)
- Buat file test baru `tests/Feature/UserApiTest.php` untuk memvalidasi endpoint CRUD User di tenant database.
- Buat file test baru `tests/Feature/TenantSetupApiTest.php` untuk memvalidasi registrasi tenant, otentikasi token central, dan inisialisasi schema DB.
- Jalankan test dengan command:
  ```bash
  php artisan test tests/Feature/UserApiTest.php
  php artisan test tests/Feature/TenantSetupApiTest.php
  ```

### Manual Verification
1. **Pendaftaran Tenant**: Buka `/landlord`, masukkan Central API Key default `nexus_central_secret`. Tambahkan tenant baru dengan nama `Acme Corp` dan slug `acme`. Verifikasi database schema terbuat.
2. **Autofill Login**: Buka `/login?tenant=acme`. Pastikan input Tenant ID otomatis terisi dengan `acme`. Login menggunakan `admin@nexushr.local` / `admin123`.
3. **Manajemen User**: Buka launcher `/users`, tambahkan user baru dengan role `HR Manager`, login dengan user tersebut, lalu verifikasi pembatasan akses.
4. **App Launcher Overlay**: Dari halaman `/users`, klik Waffle button di header. Klik ikon "Training", verifikasi router langsung berpindah ke halaman `/training` tanpa lag.
