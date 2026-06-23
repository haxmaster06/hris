# Planning: Attendance & Leave Basic Setup

## Ringkasan
Dokumen ini mendefinisikan rencana implementasi teknis untuk modul **Attendance** (Kehadiran) dan **Leave** (Cuti) pada Universal HRIS Platform (Nexus HR). Langkah-langkahnya meliputi pembuatan modul `Attendance` dan `Leave`, penyiapan migrasi database tenant, pengembangan model Eloquent, Repositories, Services (Check-in/out logic, pengajuan cuti, kalkulasi saldo cuti), API Requests/Resources/Controllers, serta penulisan unit dan feature tests.

## Referensi Dokumen
- PRD 2: [Functional Modules](file:///d:/HBM/Project/HRIS/docs/PRD/2.Functional_Modules.md)
- PRD 3: [Database and API](file:///d:/HBM/Project/HRIS/docs/PRD/3.Database_and_API.md)
- Business Rules: [business-rules.md](file:///C:/Users/masti/.gemini/antigravity-ide/knowledge/hris-business-rules/artifacts/business-rules.md)

## Kondisi Existing (Current State)
- Modul `Employee` dan `Organization` telah terbuat dan diuji dengan sukses.
- Modul `Attendance` dan `Leave` belum dibuat di bawah folder `apps/api/Modules/`.
- Skema database tenant untuk attendance dan leave belum terdefinisi.

## Target Akhir (Desired State)
- Modul `Attendance` dan `Leave` terintegrasi dengan modular monolith.
- Tabel-tabel database tenant untuk attendance (`shifts`, `employee_shifts`, `attendance_logs`) dan leave (`leave_types`, `leave_balances`, `leave_requests`, `leave_approvals`) terbuat.
- API REST CRUD untuk Shift, Log Kehadiran, Tipe Cuti, dan Request Cuti berfungsi penuh dengan validasi lengkap.
- Logika check-in/out menghitung status keterlambatan (late), pulang cepat (early leave), dan jumlah jam kerja otomatis.
- Pengajuan cuti (leave request) memvalidasi ketersediaan saldo cuti (leave balance) dan otomatis memotong saldo jika disetujui.
- Pengujian otomatis mencakup unit dan feature tests dengan cakupan coverage >= 80%.

---

## Fase 1: Pembuatan Modul & Database Migrations

### Step 1.1: Pembuatan Scaffolding Modul
- **Aksi:** Menjalankan perintah artisan:
  - `php artisan module:make Attendance`
  - `php artisan module:make Leave`
- **Detail:** Pastikan kedua modul aktif dan terdaftar di composer autoload. Matikan auto-discover migrations global di `config/modules.php` (sudah dinonaktifkan di langkah sebelumnya) dan daftarkan migrasi secara terisolasi pada Service Provider masing-masing.

### Step 1.2: Database Migrations - Attendance Module
- **Modul:** Attendance
- **Aksi:** CREATE
- **Detail:**
  - Migrasi `shifts` (Master Jadwal Kerja):
    - `id` (UUID, primary key)
    - `name` (string)
    - `code` (string, unique)
    - `start_time` (time)
    - `end_time` (time)
    - `late_tolerance` (integer, default: 0, menit)
    - Audit fields: timestamps, softDeletes, `created_by`, `updated_by`, `deleted_by`, `version`.
  - Migrasi `employee_shifts` (Pemetaan Karyawan ke Shift):
    - `id` (UUID, primary key)
    - `employee_id` (UUID, foreign key to `employees`, cascade delete)
    - `shift_id` (UUID, foreign key to `shifts`, cascade delete)
    - `start_date` (date)
    - `end_date` (date, nullable - jika null berarti shift aktif tanpa batas akhir)
    - Audit fields.
  - Migrasi `attendance_logs` (Catatan Kehadiran Harian):
    - `id` (UUID, primary key)
    - `employee_id` (UUID, foreign key to `employees`, cascade delete)
    - `date` (date)
    - `check_in` (time, nullable)
    - `check_out` (time, nullable)
    - `check_in_ip` (string, nullable)
    - `check_out_ip` (string, nullable)
    - `status` (string, e.g. `present`, `late`, `early_leave`, `absent`, `leave`)
    - `work_hours` (decimal 4,2, default: 0.00)
    - Audit fields.
    - Unique index on `(employee_id, date)`.

### Step 1.3: Database Migrations - Leave Module
- **Modul:** Leave
- **Aksi:** CREATE
- **Detail:**
  - Migrasi `leave_types` (Tipe Cuti):
    - `id` (UUID, primary key)
    - `name` (string)
    - `code` (string, unique)
    - `default_days` (integer)
    - `is_paid` (boolean, default: true)
    - Audit fields.
  - Migrasi `leave_balances` (Saldo Cuti Tahunan Karyawan):
    - `id` (UUID, primary key)
    - `employee_id` (UUID, foreign key to `employees`, cascade delete)
    - `leave_type_id` (UUID, foreign key to `leave_types`, cascade delete)
    - `year` (integer)
    - `entitled` (integer)
    - `used` (integer, default: 0)
    - `pending` (integer, default: 0)
    - `remaining` (integer)
    - Audit fields.
    - Unique index on `(employee_id, leave_type_id, year)`.
  - Migrasi `leave_requests` (Pengajuan Cuti):
    - `id` (UUID, primary key)
    - `employee_id` (UUID, foreign key to `employees`, cascade delete)
    - `leave_type_id` (UUID, foreign key to `leave_types`, cascade delete)
    - `start_date` (date)
    - `end_date` (date)
    - `total_days` (integer)
    - `reason` (text, nullable)
    - `status` (string, default: `pending`, values: `draft`, `pending`, `approved`, `rejected`)
    - Audit fields.
  - Migrasi `leave_approvals` (Persetujuan Cuti):
    - `id` (UUID, primary key)
    - `leave_request_id` (UUID, foreign key to `leave_requests`, cascade delete)
    - `approver_id` (UUID, foreign key to `users`, cascade delete)
    - `status` (string, values: `approved`, `rejected`)
    - `comments` (string, nullable)
    - Audit fields.

---

## Fase 2: Models & Pattern Layer Setup

### Step 2.1: Pembuatan Models & Factories
- **Modul:** Attendance & Leave
- **Aksi:** CREATE
- **Detail:**
  - Buat model `Shift`, `EmployeeShift`, `AttendanceLog` di modul Attendance.
  - Buat model `LeaveType`, `LeaveBalance`, `LeaveRequest`, `LeaveApproval` di modul Leave.
  - Tambahkan relasi Eloquent yang relevan.
  - Siapkan Factories untuk seluruh model.

### Step 2.2: Repositories & Bindings
- **Modul:** Attendance & Leave
- **Aksi:** CREATE
- **Detail:**
  - Buat interface dan implementasi repositori untuk seluruh model di atas.
  - Daftarkan bindings di `RepositoryServiceProvider` masing-masing modul.

### Step 2.3: Services Layer Development
- **Modul:** Attendance & Leave
- **Aksi:** CREATE
- **Detail:**
  - `AttendanceService`:
    - `checkIn(string $employeeId, string $time, ?string $ip)`:
      - Cari shift aktif karyawan untuk tanggal tersebut.
      - Tentukan status check-in: jika check-in melewati `start_time` + `late_tolerance`, set status `late`, jika tidak set `present`.
      - Buat atau update record `attendance_logs`.
    - `checkOut(string $employeeId, string $time, ?string $ip)`:
      - Cari log kehadiran hari tersebut. Jika tidak ditemukan, throw exception.
      - Hitung durasi jam kerja (`work_hours`) berdasarkan selisih check-in dan check-out.
      - Tentukan status akhir: cek jika check-out lebih cepat dari `end_time` shift, set status log menjadi `early_leave` (kecuali status sebelumnya sudah `late`).
      - Simpan check-out dan `work_hours`.
  - `LeaveService`:
    - `submitRequest(string $employeeId, string $leaveTypeId, string $startDate, string $endDate, ?string $reason)`:
      - Hitung total hari cuti (mengabaikan hari libur akhir pekan jika perlu, atau hitung selisih hari).
      - Validasi kecukupan sisa saldo cuti (`leave_balances.remaining` >= total hari).
      - Kurangi `remaining` dan tambahkan ke `pending` di `leave_balances`.
      - Buat record `leave_requests` dengan status `pending`.
    - `approveRequest(string $requestId, string $approverId, ?string $comments)`:
      - Jalankan dalam DB transaction.
      - Buat record `leave_approvals` dengan status `approved`.
      - Ubah status `leave_requests` menjadi `approved`.
      - Update `leave_balances`: pindahkan total hari dari `pending` ke `used`.
    - `rejectRequest(string $requestId, string $approverId, ?string $comments)`:
      - Jalankan dalam DB transaction.
      - Buat record `leave_approvals` dengan status `rejected`.
      - Ubah status `leave_requests` menjadi `rejected`.
      - Kembalikan `leave_balances`: pindahkan total hari dari `pending` kembali ke `remaining`.

---

## Fase 3: Validation, Formatting & Routing

### Step 3.1: Form Requests & API Resources
- **Modul:** Attendance & Leave
- **Aksi:** CREATE
- **Detail:**
  - Buat Request class untuk validasi input Check-in/Check-out, CRUD Shift, CRUD Leave Type, dan Leave Request.
  - Buat API Resources dan Collections untuk memformat data output JSON secara konsisten.

### Step 3.2: Controllers & Routes Configuration
- **Modul:** Attendance & Leave
- **Aksi:** CREATE
- **Detail:**
  - Buat `AttendanceController`, `ShiftController` di modul Attendance.
  - Buat `LeaveTypeController`, `LeaveRequestController` di modul Leave.
  - Daftarkan routing API tenant-aware terproteksi JWT token:
    - `POST /api/v1/attendances/check-in`
    - `POST /api/v1/attendances/check-out`
    - `GET  /api/v1/attendances/my-summary`
    - `GET/POST/PUT/DELETE /api/v1/shifts`
    - `GET/POST/PUT/DELETE /api/v1/leave-types`
    - `GET/POST /api/v1/leave-requests`
    - `POST /api/v1/leave-requests/{id}/approve`
    - `POST /api/v1/leave-requests/{id}/reject`
    - `GET  /api/v1/leave-balances`

---

## Fase 4: Testing & Verification

### Step 4.1: Automated Tests
- **Modul:** Attendance & Leave
- **Aksi:** CREATE
- **Detail:**
  - Tulis `AttendanceApiTest.php` untuk menguji check-in, check-out, kalkulasi keterlambatan, jam kerja, dan summary.
  - Tulis `LeaveApiTest.php` untuk menguji pengajuan cuti, validasi saldo cuti, persetujuan/penolakan cuti, dan penyesuaian saldo cuti.
  - Tulis unit tests relasi model (`AttendanceRelationsTest`, `LeaveRelationsTest`).

---

## Checklist Verifikasi Akhir
- [ ] Central & Tenant migrations untuk Attendance & Leave berjalan sukses.
- [ ] Endpoint `/api/v1/attendances/check-in` & `/api/v1/attendances/check-out` berfungsi dan memvalidasi shift dengan benar.
- [ ] Pengajuan cuti memotong saldo pending, approval memindahkan saldo pending ke used, rejection mengembalikan saldo ke remaining.
- [ ] Seluruh unit/feature tests di modul Attendance & Leave berstatus HIJAU (`passed`) dengan coverage >= 80%.
- [ ] Tidak ada efek regresi pada tes IAM, modul organisasi, dan modul karyawan.
