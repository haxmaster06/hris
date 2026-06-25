# Fase 2: Payroll & Compensation

## Ringkasan
Membangun modul Payroll lengkap (gaji pokok, tunjangan, potongan, PPh 21, BPJS, payslip) dan modul Compensation & Benefits (klaim, reimbursement, bonus). Mendukung 3 metode pajak: Gross, Nett, dan Gross-Up.

## Referensi Dokumen
- [features.md](../docs/Features/features.md) — Modul 5 (Payroll) & Modul 12 (Compensation & Benefits)

## Kondisi Existing
- Belum ada modul Payroll dan Compensation sama sekali
- Employee model sudah ada (akan ditambah salary fields di Fase 1)
- Attendance & Leave sudah ada (data lembur dan cuti bisa diakses)

## Target Akhir
- Modul Payroll: kalkulasi gaji otomatis, PPh 21 (TER method, Gross/Nett/Gross-Up), BPJS, payslip, approval, locking
- Modul Compensation: benefits enrollment, medical claims, reimbursement, bonus schemes
- Frontend lengkap untuk kedua modul

---

## Fase 2, Step 1: Modul Payroll [NEW]

### Step 1.1: Scaffold Module
```
Modules/Payroll/
├── app/
│   ├── Http/Controllers/
│   │   ├── PayrollComponentController.php
│   │   ├── EmployeeSalaryController.php
│   │   ├── PayrollPeriodController.php
│   │   ├── PayrollRunController.php
│   │   └── PayslipController.php
│   ├── Models/
│   │   ├── PayrollComponent.php
│   │   ├── EmployeeSalary.php
│   │   ├── EmployeeAllowance.php
│   │   ├── PayrollPeriod.php
│   │   ├── PayrollRun.php
│   │   ├── PayrollRunDetail.php
│   │   └── EmployeeLoan.php
│   ├── Services/
│   │   ├── PayrollCalculationService.php
│   │   ├── TaxCalculationService.php
│   │   └── BPJSCalculationService.php
│   └── Providers/
│       ├── PayrollServiceProvider.php
│       └── RouteServiceProvider.php
├── config/config.php
├── database/
│   ├── factories/
│   ├── migrations/
│   │   ├── 2026_06_25_000020_create_payroll_components_table.php
│   │   ├── 2026_06_25_000021_create_employee_salaries_table.php
│   │   ├── 2026_06_25_000022_create_employee_allowances_table.php
│   │   ├── 2026_06_25_000023_create_payroll_periods_table.php
│   │   ├── 2026_06_25_000024_create_payroll_runs_table.php
│   │   ├── 2026_06_25_000025_create_payroll_run_details_table.php
│   │   └── 2026_06_25_000026_create_employee_loans_table.php
│   └── seeders/
│       └── PayrollDatabaseSeeder.php
├── routes/api.php
├── tests/Unit/
│   ├── PayrollCalculationTest.php
│   └── TaxCalculationTest.php
├── composer.json
└── module.json
```

### Step 1.2: Migrations

#### payroll_components
```php
Schema::create('payroll_components', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('code', 20)->unique();
    $table->string('name');
    $table->string('type', 20); // earning, deduction
    $table->string('category', 30); // basic_salary, fixed_allowance, variable_allowance, overtime, tax, bpjs, loan, penalty
    $table->boolean('is_taxable')->default(true);
    $table->boolean('is_active')->default(true);
    $table->text('description')->nullable();
    $table->integer('sort_order')->default(0);
    $table->timestamps();
    $table->softDeletes();
    $table->uuid('created_by')->nullable();
    $table->uuid('updated_by')->nullable();
    $table->uuid('deleted_by')->nullable();
    $table->integer('version')->default(1);
});
```

#### employee_salaries
```php
Schema::create('employee_salaries', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('employee_id');
    $table->decimal('basic_salary', 15, 2);
    $table->string('tax_method', 20)->default('gross'); // gross, nett, gross_up
    $table->string('tax_status', 10)->default('TK/0'); // TK/0, K/0, K/1, K/2, K/3
    $table->string('bpjs_class', 5)->default('1'); // 1, 2, 3
    $table->string('bank_name', 50)->nullable();
    $table->string('bank_account', 30)->nullable();
    $table->string('bank_holder_name')->nullable();
    $table->date('effective_date');
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletes();
    $table->uuid('created_by')->nullable();
    $table->uuid('updated_by')->nullable();
    $table->uuid('deleted_by')->nullable();
    $table->integer('version')->default(1);

    $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
});
```

#### employee_allowances
```php
Schema::create('employee_allowances', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('employee_id');
    $table->uuid('payroll_component_id');
    $table->decimal('amount', 15, 2);
    $table->date('effective_date');
    $table->date('end_date')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
    $table->uuid('created_by')->nullable();
    $table->uuid('updated_by')->nullable();
    $table->uuid('deleted_by')->nullable();
    $table->integer('version')->default(1);

    $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
    $table->foreign('payroll_component_id')->references('id')->on('payroll_components')->cascadeOnDelete();
});
```

#### payroll_periods
```php
Schema::create('payroll_periods', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->integer('month'); // 1-12
    $table->integer('year');
    $table->string('name')->nullable(); // "Januari 2026"
    $table->date('start_date');
    $table->date('end_date');
    $table->date('cut_off_date'); // tanggal batas data attendance/leave
    $table->date('payment_date')->nullable();
    $table->string('status', 20)->default('draft'); // draft, processing, calculated, approved, locked, paid
    $table->timestamp('processed_at')->nullable();
    $table->uuid('processed_by')->nullable();
    $table->uuid('approved_by')->nullable();
    $table->timestamp('approved_at')->nullable();
    $table->uuid('locked_by')->nullable();
    $table->timestamp('locked_at')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletes();
    $table->uuid('created_by')->nullable();
    $table->uuid('updated_by')->nullable();
    $table->uuid('deleted_by')->nullable();
    $table->integer('version')->default(1);

    $table->unique(['month', 'year']);
});
```

#### payroll_runs
```php
Schema::create('payroll_runs', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('payroll_period_id');
    $table->uuid('employee_id');
    $table->decimal('basic_salary', 15, 2)->default(0);
    $table->decimal('total_earnings', 15, 2)->default(0); // total pendapatan (termasuk gaji pokok)
    $table->decimal('total_deductions', 15, 2)->default(0);
    $table->decimal('gross_salary', 15, 2)->default(0);
    $table->decimal('tax_amount', 15, 2)->default(0);
    $table->decimal('bpjs_tk_employee', 15, 2)->default(0); // JHT 2% + JP 1%
    $table->decimal('bpjs_tk_company', 15, 2)->default(0); // JKK 0.24% + JKM 0.3% + JHT 3.7% + JP 2%
    $table->decimal('bpjs_kes_employee', 15, 2)->default(0); // 1%
    $table->decimal('bpjs_kes_company', 15, 2)->default(0); // 4%
    $table->decimal('net_salary', 15, 2)->default(0);
    $table->decimal('take_home_pay', 15, 2)->default(0);
    $table->string('tax_method', 20)->default('gross');
    $table->integer('working_days')->default(0);
    $table->integer('present_days')->default(0);
    $table->integer('absent_days')->default(0);
    $table->integer('late_count')->default(0);
    $table->decimal('overtime_hours', 8, 2)->default(0);
    $table->decimal('overtime_amount', 15, 2)->default(0);
    $table->timestamps();
    $table->softDeletes();
    $table->uuid('created_by')->nullable();
    $table->uuid('updated_by')->nullable();
    $table->uuid('deleted_by')->nullable();
    $table->integer('version')->default(1);

    $table->foreign('payroll_period_id')->references('id')->on('payroll_periods')->cascadeOnDelete();
    $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
    $table->unique(['payroll_period_id', 'employee_id']);
});
```

#### payroll_run_details
```php
Schema::create('payroll_run_details', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('payroll_run_id');
    $table->uuid('payroll_component_id');
    $table->string('component_name'); // snapshot nama saat run
    $table->string('type', 20); // earning, deduction
    $table->decimal('amount', 15, 2);
    $table->boolean('is_taxable')->default(true);
    $table->text('notes')->nullable();
    $table->integer('sort_order')->default(0);
    $table->timestamps();

    $table->foreign('payroll_run_id')->references('id')->on('payroll_runs')->cascadeOnDelete();
    $table->foreign('payroll_component_id')->references('id')->on('payroll_components')->nullOnDelete();
});
```

#### employee_loans
```php
Schema::create('employee_loans', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('employee_id');
    $table->string('loan_number', 30)->unique();
    $table->decimal('principal_amount', 15, 2);
    $table->decimal('remaining_amount', 15, 2);
    $table->decimal('installment_amount', 15, 2);
    $table->integer('total_installments');
    $table->integer('paid_installments')->default(0);
    $table->date('start_date');
    $table->date('end_date')->nullable();
    $table->string('status', 20)->default('active'); // active, completed, cancelled
    $table->text('reason')->nullable();
    $table->uuid('approved_by')->nullable();
    $table->timestamps();
    $table->softDeletes();
    $table->uuid('created_by')->nullable();
    $table->uuid('updated_by')->nullable();
    $table->uuid('deleted_by')->nullable();
    $table->integer('version')->default(1);

    $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
});
```

### Step 1.3: Models
Semua model mengikuti pola BaseModel. Key relationships:
- `PayrollComponent` — standalone master data
- `EmployeeSalary` → belongsTo Employee
- `EmployeeAllowance` → belongsTo Employee, belongsTo PayrollComponent
- `PayrollPeriod` → hasMany PayrollRun
- `PayrollRun` → belongsTo PayrollPeriod, belongsTo Employee, hasMany PayrollRunDetail
- `PayrollRunDetail` → belongsTo PayrollRun, belongsTo PayrollComponent
- `EmployeeLoan` → belongsTo Employee

### Step 1.4: PayrollCalculationService
- **File:** `Modules/Payroll/app/Services/PayrollCalculationService.php` [NEW]
- **Detail:**
  - `calculateForEmployee(Employee $employee, PayrollPeriod $period): PayrollRun`
  - Logic flow:
    1. Get EmployeeSalary (latest effective)
    2. Get all EmployeeAllowances (active)
    3. Calculate attendance-based (working days, absent deduction, overtime)
    4. Sum earnings & deductions
    5. Calculate BPJS (via BPJSCalculationService)
    6. Calculate Tax PPh 21 (via TaxCalculationService) based on tax_method
    7. Calculate net salary & take home pay
    8. Create PayrollRun + PayrollRunDetails
  - `calculateForPeriod(PayrollPeriod $period): Collection` — batch calculate all active employees

### Step 1.5: TaxCalculationService
- **File:** `Modules/Payroll/app/Services/TaxCalculationService.php` [NEW]
- **Detail:**
  - Support PPh 21 TER (Tarif Efektif Rata-rata) method 2024+
  - TER rate tables: Kategori A (TK/0, TK/1), B (K/0, K/1), C (K/2, K/3)
  - `calculateMonthlyTax(float $grossIncome, string $taxStatus, string $taxMethod): float`
  - Tax methods:
    - **Gross**: Pajak ditanggung karyawan (potong dari gaji)
    - **Nett**: Pajak ditanggung perusahaan (tidak potong gaji)
    - **Gross-Up**: Pajak dibayar perusahaan namun dianggap tunjangan pajak

### Step 1.6: BPJSCalculationService
- **File:** `Modules/Payroll/app/Services/BPJSCalculationService.php` [NEW]
- **Detail:**
  - BPJS Ketenagakerjaan:
    - JKK: 0.24% (company)
    - JKM: 0.30% (company)
    - JHT: 3.70% (company) + 2.00% (employee)
    - JP: 2.00% (company) + 1.00% (employee), cap: UMP × ceiling
  - BPJS Kesehatan:
    - Company: 4% of salary (cap at ceiling)
    - Employee: 1% of salary (cap at ceiling)
  - `calculate(float $basicSalary, string $bpjsClass): BPJSResult`

### Step 1.7: Controllers
- `PayrollComponentController` — CRUD master komponen gaji
- `EmployeeSalaryController` — CRUD salary per employee (nested: `/employees/{employee}/salary`)
- `PayrollPeriodController` — CRUD + `calculate` action + `approve` action + `lock` action
- `PayrollRunController` — Read only (generated by calculation), `show` for payslip detail
- `PayslipController` — `GET /payslips/{employee}?period_id=xxx` — view payslip

### Step 1.8: Routes
```php
Route::middleware(['api', 'auth:api'])->prefix('api/v1')->group(function () {
    Route::apiResource('payroll-components', PayrollComponentController::class);
    Route::apiResource('employees.salary', EmployeeSalaryController::class)
        ->parameters(['salary' => 'employeeSalary']);
    Route::apiResource('employees.allowances', EmployeeAllowanceController::class);
    Route::apiResource('payroll-periods', PayrollPeriodController::class);
    Route::post('payroll-periods/{payrollPeriod}/calculate', [PayrollPeriodController::class, 'calculate']);
    Route::post('payroll-periods/{payrollPeriod}/approve', [PayrollPeriodController::class, 'approve']);
    Route::post('payroll-periods/{payrollPeriod}/lock', [PayrollPeriodController::class, 'lock']);
    Route::get('payroll-runs', [PayrollRunController::class, 'index']);
    Route::get('payroll-runs/{payrollRun}', [PayrollRunController::class, 'show']);
    Route::get('payslips/{employee}', [PayslipController::class, 'show']);
    Route::apiResource('employee-loans', EmployeeLoanController::class);
});
```

### Step 1.9: Seeder — Default PayrollComponents
```php
$components = [
    ['code' => 'BASIC', 'name' => 'Gaji Pokok', 'type' => 'earning', 'category' => 'basic_salary', 'is_taxable' => true],
    ['code' => 'TJAB', 'name' => 'Tunjangan Jabatan', 'type' => 'earning', 'category' => 'fixed_allowance', 'is_taxable' => true],
    ['code' => 'TMKN', 'name' => 'Tunjangan Makan', 'type' => 'earning', 'category' => 'variable_allowance', 'is_taxable' => true],
    ['code' => 'TTRP', 'name' => 'Tunjangan Transport', 'type' => 'earning', 'category' => 'variable_allowance', 'is_taxable' => true],
    ['code' => 'TKOM', 'name' => 'Tunjangan Komunikasi', 'type' => 'earning', 'category' => 'fixed_allowance', 'is_taxable' => true],
    ['code' => 'LMBR', 'name' => 'Lembur', 'type' => 'earning', 'category' => 'overtime', 'is_taxable' => true],
    ['code' => 'PPH21', 'name' => 'PPh 21', 'type' => 'deduction', 'category' => 'tax', 'is_taxable' => false],
    ['code' => 'BPJSTK', 'name' => 'BPJS Ketenagakerjaan', 'type' => 'deduction', 'category' => 'bpjs', 'is_taxable' => false],
    ['code' => 'BPJSKS', 'name' => 'BPJS Kesehatan', 'type' => 'deduction', 'category' => 'bpjs', 'is_taxable' => false],
    ['code' => 'LOAN', 'name' => 'Cicilan Pinjaman', 'type' => 'deduction', 'category' => 'loan', 'is_taxable' => false],
    ['code' => 'PENLT', 'name' => 'Denda/Penalti', 'type' => 'deduction', 'category' => 'penalty', 'is_taxable' => false],
];
```

### Step 1.10: Unit Tests
- **File:** `Modules/Payroll/tests/Unit/PayrollCalculationTest.php` — Test kalkulasi gross, nett, gross-up
- **File:** `Modules/Payroll/tests/Unit/TaxCalculationTest.php` — Test PPh 21 TER
- **File:** `Modules/Payroll/tests/Unit/BPJSCalculationTest.php` — Test BPJS rates

---

## Fase 2, Step 2: Frontend Payroll

### Step 2.1: Landing Page
- **File:** `apps/web/src/app/payroll/page.tsx` [NEW]
- **Detail:** Dashboard: total payroll cost, employee count, period status, quick actions

### Step 2.2: Payroll Components (Master)
- **File:** `apps/web/src/app/payroll/components/page.tsx` [NEW]
- **Detail:** CRUD table for payroll components

### Step 2.3: Payroll Period & Run
- **File:** `apps/web/src/app/payroll/periods/page.tsx` [NEW]
- **Detail:**
  - Table: list periods (month/year, status, employee count, total cost)
  - Actions: Create Period → Calculate → Review → Approve → Lock
  - Detail view: table of all PayrollRuns for period

### Step 2.4: Payslip View
- **File:** `apps/web/src/app/payroll/payslip/[employeeId]/page.tsx` [NEW]
- **Detail:** Payslip format: earnings table, deductions table, summary (gross, tax, net, THP)

### Step 2.5: Employee Salary Management
- **File:** `apps/web/src/app/payroll/salary/page.tsx` [NEW]
- **Detail:** Table all employees with current salary, bank info, tax method

### Step 2.6: Employee Loans
- **File:** `apps/web/src/app/payroll/loans/page.tsx` [NEW]
- **Detail:** CRUD employee loans, installment tracking

### Step 2.7: i18n
- Tambah namespace `payroll` ke `en.json` dan `id.json`

### Step 2.8: Dashboard & AppLauncher
- Tambah menu Payroll di mega menu dan App Launcher

---

## Fase 2, Step 3: Modul Compensation & Benefits [NEW]

### Step 3.1: Scaffold Module
```
Modules/Compensation/
├── app/
│   ├── Http/Controllers/
│   │   ├── BenefitController.php
│   │   ├── ClaimController.php
│   │   └── BonusSchemeController.php
│   ├── Models/
│   │   ├── Benefit.php
│   │   ├── EmployeeBenefit.php
│   │   ├── Claim.php
│   │   └── BonusScheme.php
│   └── Providers/
├── database/migrations/
│   ├── 2026_06_25_000030_create_benefits_table.php
│   ├── 2026_06_25_000031_create_employee_benefits_table.php
│   ├── 2026_06_25_000032_create_claims_table.php
│   └── 2026_06_25_000033_create_bonus_schemes_table.php
├── routes/api.php
└── tests/Unit/
```

### Step 3.2: Key Migrations

#### benefits
```php
Schema::create('benefits', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name');
    $table->string('type', 30); // health_insurance, bpjs, allowance, other
    $table->string('provider')->nullable();
    $table->decimal('company_contribution', 15, 2)->default(0);
    $table->decimal('employee_contribution', 15, 2)->default(0);
    $table->text('description')->nullable();
    $table->boolean('is_active')->default(true);
    // ... universal fields
});
```

#### claims
```php
Schema::create('claims', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('employee_id');
    $table->string('claim_number', 30)->unique();
    $table->string('type', 30); // medical, reimbursement, travel, other
    $table->decimal('amount', 15, 2);
    $table->decimal('approved_amount', 15, 2)->nullable();
    $table->date('claim_date');
    $table->text('description');
    $table->string('receipt_path')->nullable();
    $table->string('status', 20)->default('submitted'); // submitted, under_review, approved, rejected, paid
    $table->uuid('approved_by')->nullable();
    $table->timestamp('approved_at')->nullable();
    $table->text('rejection_reason')->nullable();
    // ... universal fields
});
```

### Step 3.3: Frontend
- **File:** `apps/web/src/app/compensation/page.tsx` [NEW] — Landing
- **File:** `apps/web/src/app/compensation/benefits/page.tsx` [NEW] — Benefits enrollment
- **File:** `apps/web/src/app/compensation/claims/page.tsx` [NEW] — Claims list + submit
- **File:** `apps/web/src/app/compensation/bonus/page.tsx` [NEW] — Bonus schemes

### Step 3.4: i18n
- Tambah namespace `compensation` ke `en.json` dan `id.json`

---

## Checklist Verifikasi Fase 2

- [ ] Payroll module: migrations, models, services, controllers — all created
- [ ] TaxCalculation: PPh 21 TER valid untuk semua tax_method (gross/nett/gross-up)
- [ ] BPJSCalculation: rates accurate
- [ ] PayrollRun: end-to-end calculate → approve → lock flow
- [ ] Payslip: detail view menampilkan semua komponen
- [ ] Compensation: claims CRUD + approval flow
- [ ] Unit tests: all green
- [ ] Frontend: semua halaman payroll & compensation fungsional
- [ ] i18n: EN + ID lengkap
- [ ] `npm run build` — zero errors
