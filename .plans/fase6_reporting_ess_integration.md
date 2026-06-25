# Fase 6: Reporting & Analytics, ESS, dan Integration

## Ringkasan
Perkuat modul Reporting dengan analytics dashboard (HR Analytics, Executive Dashboard), bangun fitur ESS (Employee Self Service) terintegrasi dengan RBAC di halaman existing, dan siapkan infrastruktur Integration (bank export, notification gateways, biometric API).

## Referensi Dokumen
- [features.md](../docs/Features/features.md) — Modul 16 (Reporting), bagian ESS dari Modul 1, Modul 20 (Integration)

## Keputusan Desain
- **ESS**: Tidak menggunakan halaman terpisah `/my`. Fitur ESS diimplementasikan di halaman yang sama (misal `/attendance-leave`, `/documents-reports`) dengan pembatasan akses via RBAC. Karyawan biasa hanya melihat data miliknya sendiri.
- **Integration**: Infrastruktur disiapkan dulu (abstract interface + config), implementasi koneksi ke service eksternal dilakukan bertahap setelah infrastruktur tersedia.
- **Mobile (Flutter)**: API dirancang mobile-ready, tapi fokus saat ini ke web. Tidak ada development Flutter di fase ini.

---

## Fase 6, Step 1: Reporting & Analytics

### Step 1.1: Perkuat Report Module Backend
- **File:** `Modules/Report/app/Services/ReportService.php` [NEW]
- **Detail:**
  - `attendanceReport(array $filters): Collection` — Rekap kehadiran per karyawan/departemen
  - `leaveReport(array $filters): Collection` — Pemakaian cuti, saldo
  - `payrollReport(string $periodId): Collection` — Rekap gaji per departemen
  - `turnoverReport(int $year): array` — Tingkat keluar masuk per bulan
  - `retentionReport(int $year): array` — Retention rate
  - `headcountReport(): array` — Growth per bulan
  - `workforceSummary(): array` — Demografi: gender, age, tenure, status
  - `costAnalysis(int $year): array` — Total compensation cost per departemen
  - `trainingEffectiveness(): Collection` — Pre/post score comparison

### Step 1.2: Report Controllers
- **File:** `Modules/Report/app/Http/Controllers/ReportController.php` [MODIFY]
- **Detail:** Tambah endpoint per laporan:
```php
Route::prefix('reports')->group(function () {
    Route::get('attendance', [ReportController::class, 'attendance']);
    Route::get('leave', [ReportController::class, 'leave']);
    Route::get('payroll', [ReportController::class, 'payroll']);
    Route::get('turnover', [ReportController::class, 'turnover']);
    Route::get('retention', [ReportController::class, 'retention']);
    Route::get('headcount', [ReportController::class, 'headcount']);
    Route::get('workforce-summary', [ReportController::class, 'workforceSummary']);
    Route::get('cost-analysis', [ReportController::class, 'costAnalysis']);
    Route::get('training-effectiveness', [ReportController::class, 'trainingEffectiveness']);
});
```

### Step 1.3: Frontend — Analytics Dashboard
- **File:** `apps/web/src/app/analytics/page.tsx` [NEW] — Landing: executive summary cards
- **File:** `apps/web/src/app/analytics/workforce/page.tsx` [NEW] — Workforce Summary (donut charts: gender, age dist, tenure dist, status dist)
- **File:** `apps/web/src/app/analytics/turnover/page.tsx` [NEW] — Turnover & Retention line charts per month
- **File:** `apps/web/src/app/analytics/headcount/page.tsx` [NEW] — Headcount growth area chart
- **File:** `apps/web/src/app/analytics/cost/page.tsx` [NEW] — Cost Analysis bar chart per department
- **File:** `apps/web/src/app/analytics/attendance/page.tsx` [NEW] — Attendance report table + summary
- **File:** `apps/web/src/app/analytics/leave/page.tsx` [NEW] — Leave report table
- **File:** `apps/web/src/app/analytics/payroll/page.tsx` [NEW] — Payroll report
- **Library chart:** Gunakan `recharts` (sudah umum di React ecosystem)
- **Install:** `npm install recharts` di `apps/web`
- **i18n:** Tambah namespace `analytics` ke `en.json` dan `id.json`

---

## Fase 6, Step 2: Employee Self Service (ESS)

### Step 2.1: Backend — Scope Filtering
- **File:** `Modules/Employee/app/Http/Controllers/EmployeeController.php` [MODIFY]
- **Detail:** Pada method `index()` dan `show()`, jika user bukan HR/Admin, filter hanya data miliknya:
```php
if (!$user->hasRole(['Super Admin', 'HR Admin', 'HR Manager', 'Manager'])) {
    $query->where('user_id', $user->id);
}
```
- Terapkan pola serupa di:
  - `AttendanceController` — hanya attendance milik sendiri
  - `LeaveRequestController` — hanya leave milik sendiri
  - `DocumentController` — hanya dokumen milik sendiri
  - `PayslipController` — hanya payslip milik sendiri
  - `ClaimController` — hanya claim milik sendiri

### Step 2.2: Frontend — ESS Mode Detection
- **File:** `apps/web/src/lib/permissions.ts` [NEW]
- **Detail:**
```typescript
export function isESS(user: User): boolean {
  // Employee biasa = hanya role 'Employee'
  return user.roles?.length === 1 && user.roles[0] === 'Employee';
}

export function canAccessModule(user: User, module: string): boolean {
  // Check berdasarkan permissions user
  return user.permissions?.some(p => p.startsWith(module)) ?? false;
}
```

### Step 2.3: Frontend — Conditional UI
Pada setiap halaman, tampilkan UI berdasarkan role:
- **Employee role**: Hanya melihat data miliknya, tidak ada tombol admin (bulk actions, create employee, etc.)
- **HR/Manager role**: Melihat semua data, full CRUD access
- Contoh pada `/attendance-leave`:
  - Employee: hanya tab "My Attendance" dan "My Leave" + request form
  - HR Admin: tab semua karyawan + approval
- Contoh pada `/documents-reports`:
  - Employee: hanya "My Documents" + download
  - HR Admin: semua dokumen + upload + manage categories

### Step 2.4: Profile Update Request
- **Migration:** `2026_06_25_000130_create_profile_update_requests_table.php` [NEW]
  - Fields: employee_id, field_name, old_value, new_value, status (pending/approved/rejected), approved_by
- **Model:** `ProfileUpdateRequest.php` [NEW] (di Employee module)
- **Controller:** `ProfileUpdateRequestController.php` [NEW]
- **Frontend:** Pada employee profile, employee bisa request update → HR reviews

---

## Fase 6, Step 3: Integration Layer (Infrastruktur)

### Step 3.1: Scaffold Module
```
Modules/Integration/
├── app/
│   ├── Contracts/
│   │   ├── BankExportInterface.php
│   │   ├── NotificationGatewayInterface.php
│   │   └── BiometricInterface.php
│   ├── Http/Controllers/
│   │   ├── BankExportController.php
│   │   ├── NotificationSettingController.php
│   │   └── BiometricSyncController.php
│   ├── Services/
│   │   ├── BankExport/
│   │   │   ├── MandiriBankExport.php
│   │   │   ├── BCABankExport.php
│   │   │   ├── BRIBankExport.php
│   │   │   └── BNIBankExport.php
│   │   ├── Notification/
│   │   │   ├── EmailNotificationService.php
│   │   │   └── WhatsAppNotificationService.php
│   │   ├── Biometric/
│   │   │   └── GenericBiometricService.php
│   │   └── Accounting/
│   │       └── JournalExportService.php
│   ├── Models/
│   │   ├── IntegrationConfig.php
│   │   └── NotificationLog.php
│   └── Providers/
├── database/migrations/
│   ├── 2026_06_25_000140_create_integration_configs_table.php
│   └── 2026_06_25_000141_create_notification_logs_table.php
├── routes/api.php
└── tests/Unit/
```

### Step 3.2: Key Contracts (Interfaces)

#### BankExportInterface
```php
interface BankExportInterface
{
    public function generateFile(PayrollPeriod $period): string; // returns file path
    public function getFormat(): string; // 'txt', 'csv', 'xlsx'
    public function getBankName(): string;
}
```

#### NotificationGatewayInterface
```php
interface NotificationGatewayInterface
{
    public function send(string $recipient, string $message, array $options = []): bool;
    public function getChannel(): string; // 'email', 'whatsapp', 'sms'
}
```

### Step 3.3: Key Migrations

#### integration_configs
```php
Schema::create('integration_configs', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('type', 30); // bank_export, notification, biometric, accounting, sso
    $table->string('provider', 50); // mandiri, bca, whatsapp, fonnte, generic_fingerprint
    $table->string('name');
    $table->jsonb('config'); // encrypted JSON: {api_key, endpoint, credentials, etc.}
    $table->boolean('is_active')->default(false);
    $table->timestamp('last_synced_at')->nullable();
    // ... universal fields
});
```

#### notification_logs
```php
Schema::create('notification_logs', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('channel', 20); // email, whatsapp, sms
    $table->string('recipient');
    $table->text('message');
    $table->string('status', 20); // queued, sent, delivered, failed
    $table->text('error_message')->nullable();
    $table->string('reference_type')->nullable(); // related entity type
    $table->uuid('reference_id')->nullable();
    $table->timestamp('sent_at')->nullable();
    $table->timestamps();
});
```

### Step 3.4: Bank Export Services
Implementasi 4 format bank utama:
- **Mandiri**: format fixed-width text file
- **BCA**: format CSV dengan header spesifik
- **BRI**: format text file
- **BNI**: format CSV
Setiap service implement `BankExportInterface` dengan detail format sesuai spesifikasi bank.

### Step 3.5: Frontend — Integration Settings
- **File:** `apps/web/src/app/settings/integrations/page.tsx` [NEW]
- **Detail:**
  - List configured integrations (active/inactive toggle)
  - Configure each integration: API keys, endpoints
  - Test connection button
  - Bank Export: generate file for payroll period → download

### Step 3.6: Frontend — Settings Page Structure
- **File:** `apps/web/src/app/settings/page.tsx` [NEW] — Settings landing
  - Sub-pages: `/settings/workflows`, `/settings/integrations`
- Tambah "Settings" menu di mega menu (kategori Administration)

---

## Fase 6, Step 4: i18n, Dashboard & Final Polish

### i18n
- Tambah namespaces: `analytics`, `integration`, `settings` ke `en.json` dan `id.json`
- Update existing namespaces untuk ESS-specific strings

### Dashboard & AppLauncher
- Tambah menu: Analytics, Settings
- ESS: Dashboard karyawan biasa menampilkan widget ringkasan personal (attendance summary, leave balance, pending requests)

### Permission Seeders
- Analytics: `report.attendance`, `report.leave`, `report.payroll`, `report.hr_analytics`, `report.executive_dashboard`
- Integration: `integration.view`, `integration.configure`, `integration.export`
- Profile Update: `profile_update.view`, `profile_update.approve`

---

## Checklist Verifikasi Fase 6

- [ ] Analytics: semua report endpoint menghasilkan data valid
- [ ] Analytics: chart visualizations render di frontend
- [ ] Analytics: executive dashboard workforce summary
- [ ] ESS: employee login → hanya melihat data miliknya
- [ ] ESS: employee bisa request profile update → HR approve
- [ ] ESS: employee bisa view payslip, apply leave, view attendance
- [ ] Integration: bank export generate file valid (minimal 1 bank)
- [ ] Integration: notification service terabstraksi via interface
- [ ] Integration: settings page CRUD integration config
- [ ] Unit tests: all green
- [ ] i18n complete (EN + ID)
- [ ] `php artisan test` — all green
- [ ] `npm run build` — zero errors
- [ ] Dokumentasi `ERP_FULL_FLOW_GUIDE.md` updated
