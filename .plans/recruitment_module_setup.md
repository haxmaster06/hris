# Planning: Recruitment Module Setup (Sprint 2.1)

## Ringkasan
Dokumen ini mendefinisikan rencana implementasi teknis untuk modul **Recruitment** pada Universal HRIS Platform (Nexus HR). Cakupan rencana ini meliputi pembuatan modul backend `Recruitment`, migrasi database tenant, pemodelan data rekrutmen beserta relasi, setup Repositories dan Services, pembuatan API Requests/Resources/Controllers, integrasi UI Kanban Board di frontend Next.js, serta penulisan automated tests.

## Referensi Dokumen
- PRD 2: [Functional Modules](file:///d:/HBM/Project/HRIS/docs/PRD/2.Functional_Modules.md)
- PRD 3: [Database and API](file:///d:/HBM/Project/HRIS/docs/PRD/3.Database_and_API.md)
- Business Rules: [business-rules.md](file:///C:/Users/masti/.gemini/antigravity-ide/knowledge/hris-business-rules/artifacts/business-rules.md)

## Kondisi Existing (Current State)
- Modul backend untuk Phase 1 (Organization, Employee, Attendance, Leave, Document, Report) sudah lengkap dan berjalan normal.
- Modul `Recruitment` belum dibuat di backend `apps/api/Modules/`.
- Frontend Next.js di `apps/web/src/app` belum memiliki halaman atau integrasi modul rekrutmen.
- Database tenant belum memiliki tabel-tabel pendukung rekrutmen.

## Target Akhir (Desired State)
- Modul backend `Recruitment` aktif dan mengelola lowongan kerja (Vacancy), kandidat (Candidate), aplikasi pekerjaan (Job Application), wawancara (Interview), dan persetujuan penerimaan (Hiring Approval).
- Pipeline rekrutmen mendukung status: `applied`, `screening`, `interview`, `assessment`, `offering`, `hired`, `rejected`.
- Ketika aplikasi pekerjaan mencapai status `hired` (melalui proses persetujuan multi-level: HR -> Manager -> Director), sistem secara otomatis membuat data karyawan (`employees`) baru di modul Employee.
- Frontend Next.js memiliki tampilan dashboard rekrutmen yang bersih dengan Kanban Board untuk memindahkan kandidat antar tahapan pipeline secara intuitif.
- Seluruh endpoint API rekrutmen terproteksi middleware tenancy dan JWT auth dengan pemeriksaan hak akses (Spatie permission).
- Test coverage minimal 80% berupa unit dan feature tests.

---

## Fase 1: Database Schema & Migration Setup

### Step 1.1: Pembuatan Modul Recruitment
- **Modul:** Recruitment
- **File:** `apps/api/Modules/Recruitment/module.json`
- **Aksi:** CREATE
- **Detail:**
  - Jalankan `php artisan module:make Recruitment` untuk generate scaffolding awal modul.
  - Daftarkan class `Modules\Recruitment\Providers\RecruitmentServiceProvider` di autoload Laravel.
- **Validasi:** File modul berhasil dibuat dan perintah `php artisan module:list` menampilkan status enabled untuk modul Recruitment.

### Step 1.2: Database Migrations (Tenant Database)
- **Modul:** Recruitment
- **Aksi:** CREATE
- **Detail:**
  - **Tabel `vacancies`**:
    - `id` (UUID, primary key)
    - `company_id` (UUID, foreign key ke `companies`)
    - `branch_id` (UUID, foreign key ke `branches`, nullable)
    - `department_id` (UUID, foreign key ke `departments`, nullable)
    - `position_id` (UUID, foreign key ke `positions`)
    - `title` (string)
    - `description` (text)
    - `requirements` (text)
    - `slots` (integer, default 1)
    - `status` (string, e.g. `draft`, `published`, `closed`)
    - Audit fields (timestamps, softDeletes, `created_by`, `updated_by`, `deleted_by`, `version`).
  - **Tabel `candidates`**:
    - `id` (UUID, primary key)
    - `first_name` (string)
    - `last_name` (string, nullable)
    - `email` (string, unique per tenant)
    - `phone` (string, nullable)
    - `resume_path` (string, nullable, path file di MinIO/S3)
    - Audit fields.
  - **Tabel `job_applications`**:
    - `id` (UUID, primary key)
    - `vacancy_id` (UUID, foreign key ke `vacancies`, cascade)
    - `candidate_id` (UUID, foreign key ke `candidates`, cascade)
    - `status` (string, default `applied`, e.g. `applied`, `screening`, `interview`, `assessment`, `offering`, `hired`, `rejected`)
    - `applied_date` (date)
    - Audit fields.
  - **Tabel `interviews`**:
    - `id` (UUID, primary key)
    - `job_application_id` (UUID, foreign key ke `job_applications`, cascade)
    - `interview_date` (dateTime)
    - `interviewer_id` (UUID, foreign key ke `users` / `employees`, cascade)
    - `notes` (text, nullable)
    - `score` (integer, nullable, scale 1-100)
    - `status` (string, default `scheduled`, e.g. `scheduled`, `completed`, `cancelled`)
    - Audit fields.
  - **Tabel `hiring_approvals`**:
    - `id` (UUID, primary key)
    - `job_application_id` (UUID, foreign key ke `job_applications`, cascade)
    - `approver_id` (UUID, foreign key ke `users`, cascade)
    - `stage` (string, e.g. `hr`, `manager`, `director`)
    - `status` (string, default `pending`, e.g. `pending`, `approved`, `rejected`)
    - `comments` (string, nullable)
    - Audit fields.
- **Validasi:** Migrasi modul otomatis terdaftar di setup tenancy via service provider, dan `php artisan tenants:migrate` berjalan sukses tanpa error.

---

## Fase 2: Models & Pattern Layer Setup

### Step 2.1: Eloquent Models & Factories
- **Modul:** Recruitment
- **File:**
  - `apps/api/Modules/Recruitment/app/Models/Vacancy.php`
  - `apps/api/Modules/Recruitment/app/Models/Candidate.php`
  - `apps/api/Modules/Recruitment/app/Models/JobApplication.php`
  - `apps/api/Modules/Recruitment/app/Models/Interview.php`
  - `apps/api/Modules/Recruitment/app/Models/HiringApproval.php`
- **Aksi:** CREATE
- **Detail:**
  - Seluruh model mewarisi `App\Models\BaseModel` untuk UUID v7, SoftDeletes, dan Audit Logging otomatis.
  - Definisikan relasi:
    - `Vacancy` belongsTo `Company`, `Branch`, `Department`, `Position`, dan hasMany `JobApplication`.
    - `Candidate` hasMany `JobApplication`.
    - `JobApplication` belongsTo `Vacancy`, `Candidate`, dan hasMany `Interview` & `HiringApproval`.
    - `Interview` belongsTo `JobApplication`, `User`/`Employee` (interviewer).
    - `HiringApproval` belongsTo `JobApplication` dan `User` (approver).
  - Buat database factories untuk mempermudah seed data dan automated tests.
- **Validasi:** Model relasi diuji menggunakan Tinker atau unit tests untuk memastikan query relasi mengembalikan data yang benar.

### Step 2.2: Repositories Layer
- **Modul:** Recruitment
- **Aksi:** CREATE
- **Detail:**
  - Terapkan design pattern Repository dengan memisahkan Interface dan Concrete class.
  - Buat Repository untuk `Vacancy`, `Candidate`, `JobApplication`, `Interview`, dan `HiringApproval`.
  - Daftarkan bind interface ke concrete class pada `Modules\Recruitment\Providers\RepositoryServiceProvider`.
- **Validasi:** Interface repository dapat ter-resolve secara otomatis dari Laravel IoC container.

### Step 2.3: Services Layer & Business Logic
- **Modul:** Recruitment
- **Aksi:** CREATE
- **Detail:**
  - Buat `VacancyService`, `CandidateService`, `JobApplicationService`, `InterviewService`, dan `HiringApprovalService`.
  - **Fungsi Khusus pada `JobApplicationService` & `HiringApprovalService`**:
    - Transisi Pipeline: Perubahan status aplikasi divalidasi ketat (misal: tidak bisa berpindah langsung dari `applied` ke `hired` tanpa `screening` / `interview` / `offering`).
    - Alur Persetujuan Penerimaan (Hiring Approval):
      - Ketika aplikasi dipindahkan ke tahap `hired`, sistem akan membuat entri persetujuan penerimaan secara berjenjang (`hr` -> `manager` -> `director`).
      - Pengguna dengan role HR dapat melakukan approval pertama, disusul oleh Manager departemen bersangkutan, dan disetujui akhir oleh Director.
      - Jika salah satu menolak (`rejected`), status aplikasi berubah menjadi `rejected`.
      - Jika disetujui penuh (Director menyetujui), sistem memicu logic otomatis pembuatan data karyawan baru di modul Employee.
    - Pembuatan Karyawan Otomatis:
      - Setelah disetujui akhir, panggil `EmployeeService` untuk meng-insert data ke `employees` dengan status `probation` atau sesuai kesepakatan tawaran kerja. Data `first_name`, `last_name`, `email`, dan `phone` diambil langsung dari data `Candidate` terkait.

---

## Fase 3: API Request Validation, Formatter, and Routing

### Step 3.1: Form Requests & API Resources
- **Modul:** Recruitment
- **Aksi:** CREATE
- **Detail:**
  - Buat Form Requests untuk validasi input lowongan, data kandidat, registrasi aplikasi, penjadwalan interview, pengisian penilaian interview, dan approval.
  - Buat API Resources & Collections untuk menyeragamkan output data JSON ke frontend Next.js.
- **Validasi:** Payload API tervalidasi dengan benar dan mengembalikan error code `422` jika input salah.

### Step 3.2: Controllers & Routes Registration
- **Modul:** Recruitment
- **Aksi:** CREATE
- **Detail:**
  - Buat controller untuk masing-masing resources: `VacancyController`, `CandidateController`, `JobApplicationController`, `InterviewController`, `HiringApprovalController` mewarisi `BaseController`.
  - Daftarkan routing API modular di `routes/api.php` modul Recruitment:
    ```php
    // apps/api/Modules/Recruitment/routes/api.php
    Route::middleware(['api', 'tenant'])->prefix('v1')->group(function () {
        Route::apiResource('vacancies', VacancyController::class);
        Route::post('vacancies/{id}/publish', [VacancyController::class, 'publish']);
        Route::post('vacancies/{id}/close', [VacancyController::class, 'close']);
        
        Route::apiResource('candidates', CandidateController::class);
        
        Route::apiResource('applications', JobApplicationController::class);
        Route::post('applications/{id}/move-stage', [JobApplicationController::class, 'moveStage']);
        
        Route::apiResource('interviews', InterviewController::class);
        Route::post('interviews/{id}/submit-result', [InterviewController::class, 'submitResult']);
        
        Route::apiResource('hiring-approvals', HiringApprovalController::class);
        Route::post('hiring-approvals/{id}/approve', [HiringApprovalController::class, 'approve']);
        Route::post('hiring-approvals/{id}/reject', [HiringApprovalController::class, 'reject']);
    });
    ```
- **Validasi:** Endpoint terdaftar di routes list (`php artisan route:list`) dan terproteksi middleware auth.

---

## Fase 4: Frontend UI Implementation (Next.js)

### Step 4.1: API Hooks & Zustand Store
- **Modul:** Frontend
- **File:**
  - `apps/web/src/features/recruitment/services/recruitmentApi.ts`
  - `apps/web/src/features/recruitment/hooks/useRecruitment.ts`
- **Aksi:** CREATE
- **Detail:**
  - Buat Axios bindings untuk memanggil endpoint API lowongan, kandidat, aplikasi, interview, dan approval.
  - Buat React Query hooks (`useQuery`, `useMutation`) untuk sinkronisasi state server dengan UI frontend.

### Step 4.2: UI Halaman & Dashboard Recruitment
- **Modul:** Frontend
- **File:**
  - `apps/web/src/app/recruitment/page.tsx`
  - `apps/web/src/app/recruitment/vacancies/page.tsx`
  - `apps/web/src/app/recruitment/candidates/page.tsx`
- **Aksi:** CREATE
- **Detail:**
  - Buat landing page dashboard rekrutmen di `/recruitment` berisi ringkasan statistik (Total Lowongan Aktif, Kandidat di Pipeline, Interview Terjadwal Hari Ini).
  - Tampilkan tombol navigasi "Kembali ke Dashboard Utama" (App Launcher) sesuai dengan `RULE[modul-behaviour.md]`.
  - Buat tabel CRUD untuk Master Lowongan Kerja (Vacancy) dan Master Database Kandidat (Candidate).

### Step 4.3: Recruitment Kanban Pipeline Board
- **Modul:** Frontend
- **File:** `apps/web/src/app/recruitment/pipeline/page.tsx`
- **Aksi:** CREATE
- **Detail:**
  - Buat Kanban Board visual yang membagi layar menjadi kolom horizontal sesuai dengan tahapan pipeline: `Applied`, `Screening`, `Interview`, `Assessment`, `Offering`, `Hiring`.
  - Tiap kolom menampilkan kartu nama kandidat (Job Application).
  - Berikan interaksi perpindahan stage secara aman dengan button perpindahan step di detail kartu atau fungsionalitas drag-and-drop.
  - Perpindahan stage memicu mutasi API `/move-stage` dan memperbarui UI secara real-time.

### Step 4.4: Interview Scheduler & Evaluation Cards
- **Modul:** Frontend
- **File:** `apps/web/src/app/recruitment/interviews/page.tsx`
- **Aksi:** CREATE
- **Detail:**
  - UI untuk membuat jadwal wawancara, memilih pewawancara (karyawan tenant), tanggal/waktu, dan menulis catatan/skor evaluasi.

### Step 4.5: Hiring Approval Queue
- **Modul:** Frontend
- **File:** `apps/web/src/app/recruitment/approvals/page.tsx`
- **Aksi:** CREATE
- **Detail:**
  - Tampilan daftar permohonan persetujuan penerimaan kandidat yang membutuhkan tindakan user yang aktif (sesuai hak akses / role).
  - Form dialog berisi tombol "Approve" (Hijau) dan "Reject" (Merah) lengkap dengan input text komentar persetujuan.

### Step 4.6: Update App Launcher
- **Modul:** Frontend
- **File:** `apps/web/src/app/dashboard/page.tsx`
- **Aksi:** MODIFY
- **Detail:**
  - Tambahkan kartu item modul baru: "Recruitment" di grid launcher agar user bisa menavigasi ke modul Rekrutmen.
  - Berikan ikon yang relevan (misalnya `Briefcase` atau `UserPlus` dari `lucide-react`) dan skema warna premium (dari `fuchsia-500/10` ke `pink-500/10`).

---

## Fase 5: Testing & Verification

### Step 5.1: Backend Integration & Unit Tests
- **Modul:** Recruitment
- **File:**
  - `apps/api/Modules/Recruitment/tests/Unit/VacancyTest.php`
  - `apps/api/Modules/Recruitment/tests/Feature/RecruitmentApiTest.php`
- **Aksi:** CREATE
- **Detail:**
  - Tulis unit test untuk relasi model dan logic filter lowongan.
  - Tulis feature test untuk menguji alur pipeline lengkap:
    - Pendaftaran kandidat dan apply pekerjaan.
    - Pergerakan stage kandidat.
    - Proses persetujuan Hiring Approval berjenjang (HR -> Manager -> Director).
    - Verifikasi pembuatan record `employees` baru secara otomatis saat disetujui akhir.
- **Validasi:** `php artisan test --filter=Recruitment` berjalan sukses (HIJAU 100%).

### Step 5.2: Frontend Compile Verification
- **Modul:** Frontend
- **Aksi:** RUN
- **Detail:**
  - Jalankan build produksi local: `npm run build` di dalam folder `apps/web` untuk memastikan tidak ada compiler errors (TypeScript atau Turbopack).

---

## Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| **Data Leakage Lintas Tenant** | Sangat Tinggi | Pastikan semua query database di backend berjalan di koneksi tenant yang aktif via middleware `tenant` dari `stancl/tenancy`. Tulis integration test khusus multitenant. |
| **Pembuatan Karyawan Duplikat** | Sedang | Validasi kecocokan email kandidat yang disetujui dengan data `employees` existing sebelum membuat data karyawan baru. |
| **Circular Dependencies Modul** | Sedang | Ikuti standard boundary. Modul Recruitment memanggil EmployeeService via abstraction atau method service yang bersih, hindari direct coupling model silang jika melanggar deptrac. |

---

## Checklist Verifikasi Akhir
- [ ] Modul `Recruitment` aktif di backend.
- [ ] Seluruh migrasi database tenant untuk Recruitment berhasil dieksekusi (`vacancies`, `candidates`, `job_applications`, `interviews`, `hiring_approvals`).
- [ ] API routes terproteksi auth JWT dan resolve tenant id dengan benar.
- [ ] Perpindahan status pipeline memicu validasi dan log audit yang sesuai.
- [ ] Transisi ke status `hired` memicu pembuatan user karyawan (`employees`) secara otomatis.
- [ ] Tampilan dashboard rekrutmen dan Kanban board di Next.js berjalan responsif dan interaktif.
- [ ] Tombol kembali ke dashboard utama berfungsi di setiap sub-page rekrutmen.
- [ ] Seluruh unit & feature tests di backend lulus 100%.
- [ ] Build frontend Next.js berjalan sukses tanpa ada error.
