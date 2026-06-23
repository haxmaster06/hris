# Planning: Employee Module Setup

## Ringkasan
Dokumen ini mendefinisikan rencana implementasi teknis untuk modul **Employee** pada Universal HRIS Platform (Nexus HR). Langkah-langkahnya meliputi pembuatan modul `Employee`, pembuatan migrasi database tenant, pemodelan data karyawan beserta relasi, setup Repositories dan Services, pembuatan API Requests/Resources/Controllers, serta penulisan unit dan feature tests.

## Referensi Dokumen
- PRD 1: [Foundation Architecture](file:///d:/HBM/Project/HRIS/docs/PRD/1.Foundation_Architecture.md)
- PRD 2: [Functional Modules](file:///d:/HBM/Project/HRIS/docs/PRD/2.Functional_Modules.md)
- PRD 3: [Database and API](file:///d:/HBM/Project/HRIS/docs/PRD/3.Database_and_API.md)
- Business Rules: [business-rules.md](file:///C:/Users/masti/.gemini/antigravity-ide/knowledge/hris-business-rules/artifacts/business-rules.md)

## Kondisi Existing (Current State)
- Modul `Organization` telah terbuat dan diuji dengan sukses (seluruh REST CRUD APIs berjalan lancar).
- Modul `Employee` belum terbuat sama sekali di bawah folder `apps/api/Modules/`.
- Skema database untuk karyawan belum terdefinisi di database tenant.

## Desired State
- Modul `Employee` aktif dan terintegrasi dengan modular monolith.
- Tabel-tabel database tenant untuk data karyawan (`employees`, `employee_family`, `employee_education`, `employee_experience`, `employee_histories`) terbuat.
- CRUD REST APIs untuk Employee (`/api/v1/employees`) terimplementasi lengkap dengan sub-resources (family, education, experience, history).
- Pencatatan riwayat karir (`employee_histories`) berjalan otomatis ketika terjadi perubahan posisi, departemen, cabang, atau status kerja karyawan.
- Seluruh endpoint di atas terproteksi oleh middleware `InitializeTenancy` dan auth guard `auth:api` (JWT) dengan Spatie permission checks.
- Test coverage minimal 80% berupa unit dan feature tests.

---

## Fase 1: Module Creation & Migrations

### Step 1.1: Pembuatan Modul Employee
- **Aksi:** Menjalankan `php artisan module:make Employee` di folder `apps/api` untuk meng-generate scaffolding modul baru.
- **Detail:** Posisikan file `module.json` agar terintegrasi dengan composer autoload.

### Step 1.2: Database Migrations
- **Modul:** Employee
- **Aksi:** CREATE
- **Detail:**
  - Migrasi `employees`:
    - `id` (UUID, primary key)
    - `user_id` (UUID, nullable, foreign key to `users`)
    - `company_id` (UUID, foreign key to `companies`)
    - `branch_id` (UUID, foreign key to `branches`)
    - `department_id` (UUID, foreign key to `departments`)
    - `position_id` (UUID, foreign key to `positions`)
    - `employee_number` (string, unique)
    - `first_name` (string)
    - `last_name` (string, nullable)
    - `gender` (string)
    - `birth_date` (date)
    - `join_date` (date)
    - `status` (string, e.g. `probation`, `contract`, `permanent`, `resigned`)
    - Audit fields: standard timestamps, softDeletes, `created_by`, `updated_by`, `deleted_by`, `version`.
  - Migrasi `employee_family`:
    - `id` (UUID, primary key)
    - `employee_id` (UUID, foreign key to `employees`, cascade delete)
    - `name` (string)
    - `relationship` (string, e.g. `spouse`, `child`, `parent`)
    - `birth_date` (date, nullable)
    - Audit fields.
  - Migrasi `employee_education`:
    - `id` (UUID, primary key)
    - `employee_id` (UUID, foreign key to `employees`, cascade delete)
    - `institution` (string)
    - `degree` (string)
    - `major` (string)
    - `graduation_year` (integer)
    - Audit fields.
  - Migrasi `employee_experience`:
    - `id` (UUID, primary key)
    - `employee_id` (UUID, foreign key to `employees`, cascade delete)
    - `company_name` (string)
    - `position` (string)
    - `start_date` (date)
    - `end_date` (date, nullable)
    - Audit fields.
  - Migrasi `employee_histories`:
    - `id` (UUID, primary key)
    - `employee_id` (UUID, foreign key to `employees`, cascade delete)
    - `type` (string, e.g. `mutation`, `promotion`, `status_change`)
    - `field` (string, e.g. `position_id`, `department_id`, `status`)
    - `old_value` (string, nullable)
    - `new_value` (string, nullable)
    - `effective_date` (date)
    - Audit fields.

---

## Fase 2: Models & Pattern Layer Setup

### Step 2.1: Pembuatan Models & Factories
- **Modul:** Employee
- **Aksi:** CREATE
- **Detail:**
  - Buat model `Employee`, `EmployeeFamily`, `EmployeeEducation`, `EmployeeExperience`, dan `EmployeeHistory` mewarisi `App\Models\BaseModel`.
  - Definisikan relasi Eloquent (e.g. `Employee` hasMany `EmployeeFamily`, belongsTo `Position`, dll).
  - Buat Factories untuk seluruh model agar mempermudah testing.

### Step 2.2: Repositories & Services Layer
- **Modul:** Employee
- **Aksi:** CREATE
- **Detail:**
  - Buat `EmployeeRepositoryInterface` dan implementasi `EmployeeRepository`.
  - Buat repository pendukung untuk family, education, experience, dan history.
  - Daftarkan bindings di `RepositoryServiceProvider` modul `Employee`.
  - Buat `EmployeeService` yang membungkus logika CRUD di dalam database transactions. Saat update, bandingkan nilai lama dan nilai baru untuk field sensitif (`position_id`, `department_id`, `branch_id`, `status`), jika berubah tulis ke `employee_histories`.

---

## Fase 3: Validation, Formatting & Routing

### Step 3.1: Form Requests & API Resources
- **Modul:** Employee
- **Aksi:** CREATE
- **Detail:**
  - Buat `CreateEmployeeRequest` & `UpdateEmployeeRequest` dengan aturan ketat untuk data personal dan data ketenagakerjaan.
  - Buat Request pendukung untuk CRUD sub-resources (family, education, experience).
  - Buat Resource/Collection formatters untuk menstandarisasi output API.

### Step 3.2: Controllers & Routes Configuration
- **Modul:** Employee
- **Aksi:** CREATE
- **Detail:**
  - Buat `EmployeeController` dan controller pembantu untuk sub-resources.
  - Definisikan routing tenant-aware di `api.php` modul Employee di bawah prefix `v1` terproteksi JWT token.
  - Registrasikan middleware `InitializeTenancy`.

---

## Fase 4: Testing & Verification

### Step 4.1: Feature Tests & Verification
- **Modul:** Employee
- **Aksi:** CREATE
- **Detail:**
  - Tulis `EmployeeApiTest.php` untuk menguji CRUD `/api/v1/employees`.
  - Tulis tes untuk riwayat karir otomatis (`test_employee_history_logged_on_position_change`).
  - Tulis sub-resource API tests (`EmployeeFamilyApiTest`, `EmployeeEducationApiTest`, `EmployeeExperienceApiTest`).

---

## Checklist Verifikasi Akhir
- [ ] Central dan Tenant migrations berjalan sukses.
- [ ] Endpoint `/api/v1/employees` mengembalikan daftar karyawan dengan format JSON standar.
- [ ] Perubahan posisi (`position_id`) atau status karyawan otomatis menulis riwayat di `employee_histories`.
- [ ] Seluruh unit/feature tests di modul Employee berstatus HIJAU (`passed`) dengan coverage >= 80%.
- [ ] Tidak ada efek regresi pada tes otentikasi JWT dan modul organisasi.
