# Planning: Step 1.7 — Document Management & Reporting Basic

## Ringkasan
Dokumen ini mendefinisikan rencana implementasi teknis untuk **Step 1.7 — Document Management (M12) & Reporting Basic (M17)** di backend Laravel. Modul Document mengelola dokumen karyawan (KTP, NPWP, BPJS, dll.) dengan menyimpannya secara aman ke MinIO/S3 dan menyediakan akses terkontrol via signed URL. Modul Report menyediakan API reporting dasar untuk Karyawan, Kehadiran, dan Cuti dasar dengan fitur pemfilteran yang fleksibel.

## Referensi Dokumen
- PRD 2: [Functional Modules](file:///d:/HBM/Project/HRIS/docs/PRD/2.Functional_Modules.md)
- PRD 3: [Database and API](file:///d:/HBM/Project/HRIS/docs/PRD/3.Database_and_API.md)
- PRD 5: [Security and Compliance](file:///d:/HBM/Project/HRIS/docs/PRD/5.Security_and_Compliance.md)

## Kondisi Existing (Current State)
- Modul Core, Organization, Employee, Attendance, dan Leave telah diimplementasikan dengan test suite yang 100% lulus (hijau).
- Docker Compose menyediakan layanan MinIO (port 9000/9001) untuk local development, tetapi Laravel belum memiliki library driver S3 (`league/flysystem-aws-s3-v3`) dan konfigurasi `.env` lokal belum terisi lengkap.
- Belawat struktur database tenant belum memiliki tabel `document_categories` dan `documents`.

## Target Akhir (Desired State)
- Library `league/flysystem-aws-s3-v3` terinstall di backend.
- Modul `Document` berhasil dibuat dengan skema tabel `document_categories` dan `documents` serta support upload aman ke S3/MinIO menggunakan pemisahan folder per tenant.
- Fitur signed URL berfungsi penuh dengan durasi kedaluwarsa singkat (misalnya 15 menit).
- Modul `Report` berhasil dibuat dengan service-service reporting untuk data Karyawan, Kehadiran, dan Cuti dasar.
- Unit & Feature test dengan coverage minimum 80% untuk kedua modul baru ini.

---

## Fase 1: Persiapan & Install Dependencies
### Step 1.1: Install S3 Driver & Config `.env`
- **Modul:** Core / System
- **File:**
  - `apps/api/composer.json` [MODIFY]
  - `apps/api/.env` [MODIFY]
  - `apps/api/.env.example` [MODIFY]
- **Aksi:** MODIFY
- **Detail:**
  - Jalankan `composer require league/flysystem-aws-s3-v3` untuk instalasi driver S3.
  - Tambahkan variabel MinIO lokal pada `.env` dan `.env.example`:
    ```env
    AWS_ACCESS_KEY_ID=minioadmin
    AWS_SECRET_ACCESS_KEY=minioadmin
    AWS_DEFAULT_REGION=us-east-1
    AWS_BUCKET=hris-documents
    AWS_ENDPOINT=http://127.0.0.1:9000
    AWS_USE_PATH_STYLE_ENDPOINT=true
    ```
- **Validasi:** Jalankan `php artisan tinker` dan tes koneksi: `Storage::disk('s3')->put('test.txt', 'MinIO Connection OK');`

---

## Fase 2: Modul Document Management (M12)
### Step 2.1: Scaffolding Modul & Migrasi Database
- **Modul:** Document
- **File:**
  - `apps/api/Modules/Document/` [NEW]
  - `apps/api/Modules/Document/database/migrations/2026_06_23_000031_create_document_categories_table.php` [NEW]
  - `apps/api/Modules/Document/database/migrations/2026_06_23_000032_create_documents_table.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Buat modul `Document` menggunakan perintah `php artisan module:make Document`.
  - Migrasi `document_categories`:
    - `id` (UUID, primary key)
    - `name` (string)
    - `code` (string, unique)
    - Audit fields & SoftDeletes
  - Migrasi `documents`:
    - `id` (UUID, primary key)
    - `employee_id` (UUID, nullable, foreign key to employees, cascade delete)
    - `document_category_id` (UUID, nullable, foreign key to document_categories, set null)
    - `file_name` (string)
    - `original_name` (string)
    - `mime_type` (string)
    - `file_size` (bigint)
    - `storage_provider` (string, e.g. 's3')
    - `storage_path` (string)
    - `expiry_date` (date, nullable)
    - Audit fields & SoftDeletes
- **Validasi:** Jalankan `php artisan tenants:migrate` untuk memastikan migrasi sukses di schema tenant.

### Step 2.2: Models, Factories, & Repositories
- **Modul:** Document
- **File:**
  - `apps/api/Modules/Document/app/Models/DocumentCategory.php` [NEW]
  - `apps/api/Modules/Document/app/Models/Document.php` [NEW]
  - `apps/api/Modules/Document/app/Repositories/DocumentCategoryRepositoryInterface.php` [NEW]
  - `apps/api/Modules/Document/app/Repositories/DocumentCategoryRepository.php` [NEW]
  - `apps/api/Modules/Document/app/Repositories/DocumentRepositoryInterface.php` [NEW]
  - `apps/api/Modules/Document/app/Repositories/DocumentRepository.php` [NEW]
  - `apps/api/Modules/Document/app/Providers/RepositoryServiceProvider.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Implementasikan model `DocumentCategory` dan `Document` lengkap dengan model factories.
  - Implementasikan interface dan repositori konkrit untuk keduanya.
  - Daftarkan binding repositori di `RepositoryServiceProvider` lokal modul dan daftarkan service provider tersebut ke `DocumentServiceProvider`.

### Step 2.3: Service Layer & Upload Logic
- **Modul:** Document
- **File:**
  - `apps/api/Modules/Document/app/Services/DocumentService.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Buat `DocumentService` dengan fungsi:
    - `upload(UploadedFile $file, ?string $employeeId, ?string $categoryId, ?string $expiryDate)`:
      - Tentukan jalur file terisolasi: `tenants/{tenant_id}/documents/{year}/{month}/{unique_name}`
      - Simpan file ke S3 disk.
      - Catat metadata ke database.
    - `getSignedUrl(string $id, int $expiresInMinutes = 15)`:
      - Validasi keberadaan dokumen.
      - Generate signed URL menggunakan `Storage::disk('s3')->temporaryUrl($path, now()->addMinutes($expiresInMinutes))`.
    - `delete(string $id)`:
      - Hapus catatan di database.
      - Hapus file fisik dari S3 storage disk.

### Step 2.4: Requests, Resources, Controllers, & Routes
- **Modul:** Document
- **File:**
  - `apps/api/Modules/Document/app/Http/Requests/UploadDocumentRequest.php` [NEW]
  - `apps/api/Modules/Document/app/Http/Resources/DocumentResource.php` [NEW]
  - `apps/api/Modules/Document/app/Http/Controllers/DocumentController.php` [NEW]
  - `apps/api/Modules/Document/app/Http/Controllers/EmployeeDocumentController.php` [NEW]
  - `apps/api/Modules/Document/routes/api.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Buat request validation `UploadDocumentRequest` (file wajib, max 10MB, tipe pdf, jpeg, png).
  - Buat API Resource `DocumentResource` untuk transform output.
  - Buat `DocumentController` untuk menangani generic upload, detail (dengan signed url), dan delete.
  - Buat `EmployeeDocumentController` untuk menangani upload, listing, dan delete dokumen per-employee.
  - Hubungkan routes di `routes/api.php` modul Document yang di-load di bawah tenant-aware middleware (`InitializeTenancy`, `auth:api`).

---

## Fase 3: Modul Reporting Basic (M17)
### Step 3.1: Scaffolding Modul & Services
- **Modul:** Report
- **File:**
  - `apps/api/Modules/Report/` [NEW]
  - `apps/api/Modules/Report/app/Services/EmployeeReportService.php` [NEW]
  - `apps/api/Modules/Report/app/Services/AttendanceReportService.php` [NEW]
  - `apps/api/Modules/Report/app/Services/LeaveReportService.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Buat modul `Report` menggunakan perintah `php artisan module:make Report`.
  - `EmployeeReportService`: Query database employees dengan filter dinamis (company, branch, department, grade, status, gender, join_date range) dan return data terformat.
  - `AttendanceReportService`: Query data `attendance_logs` per rentang tanggal tertentu, hitung total jam kerja, total keterlambatan, jumlah ketidakhadiran, status kehadiran harian, dan ringkas per karyawan.
  - `LeaveReportService`: Query saldo cuti (`leave_balances`) dan status pengajuan cuti (`leave_requests`) per periode, hitung total hari cuti terpakai vs sisa saldo.

### Step 3.2: Controllers & Routes
- **Modul:** Report
- **File:**
  - `apps/api/Modules/Report/app/Http/Controllers/ReportController.php` [NEW]
  - `apps/api/Modules/Report/routes/api.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Implementasikan `ReportController` dengan endpoint:
    - `GET /reports/employees`
    - `GET /reports/attendance` (membutuhkan filter query `start_date` dan `end_date`)
    - `GET /reports/leave` (membutuhkan filter query `year`)
  - Format respon API harus seragam dan mendukung ekspor metadata CSV jika header request memintanya (atau return JSON standar).
  - Daftarkan routes di `routes/api.php` modul Report dengan tenant-aware middleware.

---

## Fase 4: Otorisasi & Hak Akses (Seeder)
### Step 4.1: Daftarkan Permission Baru
- **Modul:** Core / IAM
- **File:**
  - `apps/api/database/seeders/TenantPermissionSeeder.php` [MODIFY]
- **Aksi:** MODIFY
- **Detail:**
  - Tambahkan permission baru untuk Document & Report:
    - `document.upload`, `document.view`, `document.delete`
    - `report.employee`, `report.attendance`, `report.leave`
  - Assign permission tersebut ke role `super_admin` dan `hr_manager`.
  - Jalankan seeder agar database terupdate.

---

## Fase 5: Pengujian (Testing)
### Step 5.1: Unit & Feature Tests
- **Modul:** Document & Report
- **File:**
  - `apps/api/Modules/Document/tests/Feature/DocumentApiTest.php` [NEW]
  - `apps/api/Modules/Report/tests/Feature/ReportApiTest.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - `DocumentApiTest`:
    - Tes upload file (menggunakan `Illuminate\Http\Testing\FileFactory` / `UploadedFile::fake()`).
    - Tes generate signed URL.
    - Tes list dokumen per-employee.
    - Tes hapus dokumen (mematikan soft-deleted dan memverifikasi file storage terhapus).
  - `ReportApiTest`:
    - Tes query filter data karyawan.
    - Tes ringkasan laporan kehadiran untuk rentang waktu.
    - Tes laporan ringkasan cuti.
- **Validasi:** Jalankan `php artisan test` untuk memverifikasi semua tes lolos 100%.

---

## Rencana Verifikasi Akhir
### Tes Otomatis
- Jalankan `php artisan test` di `apps/api` untuk memverifikasi 100% sukses.

### Verifikasi Manual
- Periksa folder bucket MinIO `hris-documents` lokal via konsol web (http://127.0.0.1:9001) untuk memastikan struktur folder tenant terbuat dengan benar setelah file upload berhasil.
