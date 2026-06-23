# Planning: Phase 1 — MVP Foundation

## Ringkasan
Dokumen ini mendefinisikan rencana detail implementasi teknis untuk **Phase 1 — MVP Foundation** dari proyek Universal HRIS Platform (Nexus HR). Tujuan fase ini adalah membangun fondasi sistem multi-tenant berbasis schema PostgreSQL, modul manajemen identitas dan hak akses (IAM), struktur organisasi perusahaan, data karyawan, serta manajemen kehadiran dan cuti dasar.

## Referensi Dokumen
- PRD 1: [Foundation Architecture](file:///d:/HBM/Project/HRIS/docs/PRD/1.Foundation_Architecture.md)
- PRD 2: [Functional Modules](file:///d:/HBM/Project/HRIS/docs/PRD/2.Functional_Modules.md)
- PRD 3: [Database and API](file:///d:/HBM/Project/HRIS/docs/PRD/3.Database_and_API.md)
- UI Mockups: [Mockup Directory](file:///d:/HBM/Project/HRIS/Mockup/)

## Kondisi Existing (Current State)
- Struktur repositori monorepo telah disiapkan (Phase 0 Bootstrapped).
- Framework backend Laravel 12 dan Next.js 16 telah diinisialisasi.
- Komponen dasar ShadCN UI di frontend serta BaseModel, BaseController, dan HasAuditFields di backend sudah tersedia.
- Belum ada skema database central maupun database tenant yang diimplementasikan.

## Target Akhir (Desired State)
- Sistem multi-tenant PostgreSQL schema-per-tenant berjalan penuh.
- Sistem registrasi tenant dan pemetaan domain berfungsi.
- Modul IAM (Authentication via custom JWT + Authorization via Spatie RBAC) berjalan.
- Modul Organisasi (Company, Branch, Department, Division, Position, Grade) lengkap dengan REST API.
- Modul Karyawan (Employee CRUD, Riwayat Karir, Keluarga, Pendidikan) lengkap dengan antarmuka UI.
- Modul Kehadiran dasar (Check-in/out) dan Cuti dasar (Pengajuan cuti & kalkulasi saldo) siap digunakan.
- Sistem logging audit immutable aktif mencatat semua mutasi.

---

## Fase 1: MVP Foundation

### Step 1.1: Core Module — Landlord & Tenant DB Setup
- **Modul:** Core (IAM & Tenancy)
- **File:**
  - `apps/api/app/Models/Tenant.php` [NEW]
  - `apps/api/database/migrations/2019_09_15_000010_create_tenants_table.php` [MODIFY]
  - `apps/api/database/migrations/2019_09_15_000020_create_domains_table.php` [MODIFY]
- **Aksi:** CREATE / MODIFY
- **Detail:**
  - Konfigurasi Tenant model di Landlord DB menggunakan UUID.
  - Tambahkan field pada tabel `tenants` (di `public` schema): `id` (UUID), `name` (string), `slug` (string), `db_schema` (string), `created_at`, `updated_at`, `deleted_at`.
  - Tabel `domains` (di `public` schema): `id` (UUID), `domain` (string, unique), `tenant_id` (UUID, foreign key to tenants), `created_at`, `updated_at`.
- **Validasi:** Jalankan `php artisan migrate` di central database untuk membuat tabel central di schema `public`.
- **Risiko:** Konflik koneksi database di server. Mitigasi: Pastikan `.env` menggunakan user PostgreSQL yang memiliki hak akses `CREATE SCHEMA`.

### Step 1.2: Core Module — Tenant Migrations & IAM Setup
- **Modul:** Core (IAM & Tenancy)
- **File:**
  - `apps/api/database/migrations/tenant/2026_06_23_000001_create_users_table.php` [NEW]
  - `apps/api/app/Models/User.php` [NEW]
  - `apps/api/app/Http/Middleware/InitializeTenancy.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Pindahkan migrasi `users` bawaan Laravel ke folder `database/migrations/tenant` untuk dieksekusi di schema masing-masing tenant.
  - Struktur tabel `users` (di tenant schema):
    - `id` (UUID, primary key)
    - `name` (string)
    - `email` (string, unique)
    - `password` (string)
    - `created_at`, `updated_at`, `deleted_at` (soft deletes)
    - `created_by`, `updated_by`, `deleted_by` (UUID)
    - `version` (integer)
  - Pasang middleware `InitializeTenancyByHeader` dari `stancl/tenancy` dengan header `X-Tenant-ID`.
- **Validasi:** Daftarkan tenant baru via Tinker, verifikasi schema PostgreSQL baru (`tenant_{slug}`) berhasil dibuat secara otomatis beserta tabel `users`.
- **Risiko:** Keamanan token dan kebocoran data antar-tenant. Mitigasi: Pastikan middleware tenancy diset paling awal pada middleware priority.

### Step 1.3: Core Module — Custom JWT & Authorization (RBAC)
- **Modul:** Core (IAM & Tenancy)
- **File:**
  - `apps/api/config/jwt.php` [MODIFY]
  - `apps/api/app/Http/Controllers/AuthController.php` [NEW]
  - `apps/api/database/seeders/tenant/PermissionSeeder.php` [NEW]
- **Aksi:** CREATE / MODIFY
- **Detail:**
  - Konfigurasi guard `api` di `config/auth.php` menggunakan driver `jwt`.
  - Buat API Controller untuk `login`, `logout`, `refresh`, dan `me` menggunakan `tymon/jwt-auth`.
  - Pasang Spatie Permissions di schema tenant, generate tabel: `roles`, `permissions`, `model_has_roles`, `role_has_permissions`.
  - Buat `PermissionSeeder` untuk menyuntikkan hak akses dasar dengan konvensi penamaan `{module}.{action}.{scope}` (contoh: `employee.read.all`).
- **Validasi:** Lakukan request POST ke `/api/v1/auth/login` menggunakan Postman/Curl dengan body email/password, pastikan response mengembalikan access token JWT.
- **Risiko:** Token hijacking. Mitigasi: Token wajib disimpan di httpOnly cookie di frontend Next.js.

### Step 1.4: Organization Module Setup
- **Modul:** Organization
- **File:**
  - `apps/api/Modules/Organization/Database/Migrations/...` [NEW]
  - `apps/api/Modules/Organization/Entities/Company.php` [NEW]
  - `apps/api/Modules/Organization/Entities/Branch.php` [NEW]
  - `apps/api/Modules/Organization/Entities/Department.php` [NEW]
  - `apps/api/Modules/Organization/Entities/Position.php` [NEW]
  - `apps/api/Modules/Organization/Http/Controllers/...` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Migrasi `companies`: `id` (UUID), `name`, `code`, `tax_number`, `address`, audit fields.
  - Migrasi `branches`: `id` (UUID), `company_id` (foreign key), `name`, `code`, `address`, audit fields.
  - Migrasi `departments`: `id` (UUID), `branch_id`, `parent_id` (self-relation), `name`, `code`, audit fields.
  - Migrasi `positions`: `id` (UUID), `department_id`, `name`, `code`, `job_description`, audit fields.
  - Buat API CRUD untuk Company, Branch, Department, dan Position mengikuti pattern: Controller -> Service -> Repository -> Model.
- **Validasi:** Buat unit test di `Modules/Organization/Tests/Feature/` untuk menguji CRUD API.
- **Risiko:** Circular dependency di organisasi berjenjang (parent department). Mitigasi: Tambahkan validasi pada Request class untuk mencegah `parent_id` menunjuk diri sendiri atau anak cabangnya.

### Step 1.5: Employee Module Setup
- **Modul:** Employee
- **File:**
  - `apps/api/Modules/Employee/Database/Migrations/...` [NEW]
  - `apps/api/Modules/Employee/Entities/Employee.php` [NEW]
  - `apps/api/Modules/Employee/Entities/EmployeeHistory.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Migrasi `employees`: `id` (UUID), `user_id` (nullable), `company_id`, `branch_id`, `department_id`, `position_id`, `employee_number` (unique), `first_name`, `last_name`, `gender`, `birth_date`, `join_date`, `status` (active, inactive, probation, contract, permanent), audit fields.
  - Migrasi `employee_histories` (untuk melacak mutasi/promosi): `id` (UUID), `employee_id`, `type` (mutation, promotion, demotion), `old_value`, `new_value`, `effective_date`, audit fields.
  - Buat API CRUD Employee dan endpoint riwayat karir.
- **Validasi:** Buat unit test untuk memvalidasi alur perubahan status karyawan (probation -> contract -> permanent) dan pencatatan riwayat karir otomatis.
- **Risiko:** Data karyawan bocor secara tidak sah. Mitigasi: Batasi akses data sensitif (seperti kontak darurat, informasi pribadi) menggunakan permission guard khusus.

### Step 1.6: Attendance & Leave Basic Setup
- **Modul:** Attendance & Leave
- **File:**
  - `apps/api/Modules/Attendance/Database/Migrations/...` [NEW]
  - `apps/api/Modules/Leave/Database/Migrations/...` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Migrasi `attendance_logs`: `id` (UUID), `employee_id`, `check_in_time`, `check_out_time`, `ip_address`, `latitude`, `longitude`, `status` (present, late, absent), audit fields.
  - Migrasi `leave_requests`: `id` (UUID), `employee_id`, `leave_type_id`, `start_date`, `end_date`, `reason`, `status` (pending, approved, rejected), audit fields.
  - Buat API untuk Check-in/out dan pengajuan cuti beserta persetujuannya.
- **Validasi:** Jalankan integrasi test untuk memvalidasi pengurangan saldo cuti otomatis setelah pengajuan cuti berstatus `approved`.
- **Risiko:** Kehadiran palsu (GPS spoofing). Mitigasi: Siapkan validasi koordinat jarak (geofencing) dari lokasi kantor cabang.

---

## Checklist Verifikasi Akhir
- [ ] Central Migrations & Tenant Migrations berjalan 100% sukses
- [ ] JWT Access Token berhasil digenerate dan diverifikasi oleh Guard
- [ ] Endpoint `/api/v1/health` mengembalikan status healthy PostgreSQL dan Redis
- [ ] Struktur organisasi (Company -> Branch -> Department -> Position) dapat di-query tanpa batas
- [ ] Seluruh unit test modul Core, Organization, Employee, dan Attendance berstatus HIJAU (Coverage >= 80%)
