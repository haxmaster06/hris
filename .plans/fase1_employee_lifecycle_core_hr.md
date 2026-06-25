# Fase 1: Employee Lifecycle & Core HR Gaps

## Ringkasan
Memperkuat fondasi Core HR dengan menambahkan fitur yang belum ada (Cost Center, Org Chart, Emergency Contact, Reporting Structure) dan membangun modul Employee Lifecycle baru untuk menangani seluruh siklus Joiner-Mover-Leaver.

## Referensi Dokumen
- [features.md](../docs/Features/features.md) — Modul 1 (Core HR) & Modul 19 (Employee Lifecycle)
- [architecture-reference.md](../../knowledge/hris-architecture/artifacts/architecture-reference.md) — Standar arsitektur

## Kondisi Existing
- Modul Organization: 6 model (Company, Branch, Department, Division, Position, Grade)
- Modul Employee: 5 model (Employee, EmployeeFamily, EmployeeEducation, EmployeeExperience, EmployeeHistory)
- Belum ada: CostCenter, EmergencyContact, reports_to, LifecycleEvent, OnboardingChecklist, OrgChart

## Target Akhir
- Employee model diperkuat dengan `reports_to`, `division_id`, `grade_id`
- Model EmergencyContact baru
- Model CostCenter baru + UI tab di Organization
- Modul EmployeeLifecycle baru (LifecycleEvent, OnboardingChecklist)
- Organization Chart interaktif (drag-and-drop untuk mutasi)
- Employee Timeline view

---

## Fase 1, Step 1: Perkuat Employee Model

### Step 1.1: Tambah Migration — Employee fields baru
- **File:** `Modules/Employee/database/migrations/2026_06_25_000001_add_extra_fields_to_employees_table.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
```php
Schema::table('employees', function (Blueprint $table) {
    $table->uuid('division_id')->nullable()->after('department_id');
    $table->uuid('grade_id')->nullable()->after('position_id');
    $table->uuid('reports_to')->nullable()->after('grade_id');
    $table->string('phone', 20)->nullable()->after('gender');
    $table->string('email')->nullable()->after('phone');
    $table->string('id_number', 30)->nullable()->after('email'); // KTP
    $table->string('tax_number', 30)->nullable()->after('id_number'); // NPWP
    $table->string('blood_type', 5)->nullable()->after('birth_date');
    $table->string('religion', 20)->nullable()->after('blood_type');
    $table->string('marital_status', 20)->nullable()->after('religion');
    $table->text('address')->nullable()->after('marital_status');
    $table->string('city', 100)->nullable()->after('address');
    $table->string('province', 100)->nullable()->after('city');
    $table->string('postal_code', 10)->nullable()->after('province');
    $table->date('end_date')->nullable()->after('join_date');
    $table->string('employment_type', 20)->default('permanent')->after('status'); // permanent, contract, internship, outsource
    $table->string('photo_url')->nullable()->after('employment_type');

    $table->foreign('division_id')->references('id')->on('divisions')->nullOnDelete();
    $table->foreign('grade_id')->references('id')->on('grades')->nullOnDelete();
    $table->foreign('reports_to')->references('id')->on('employees')->nullOnDelete();
});
```
- **Validasi:** `php artisan migrate` berhasil

### Step 1.2: Update Employee Model
- **File:** `Modules/Employee/app/Models/Employee.php` [MODIFY]
- **Aksi:** MODIFY
- **Detail:**
  - Tambah ke `$fillable`: `division_id`, `grade_id`, `reports_to`, `phone`, `email`, `id_number`, `tax_number`, `blood_type`, `religion`, `marital_status`, `address`, `city`, `province`, `postal_code`, `end_date`, `employment_type`, `photo_url`
  - Tambah ke `$casts`: `'end_date' => 'date'`
  - Tambah relasi:
```php
use Modules\Organization\Models\Division;
use Modules\Organization\Models\Grade;

public function division(): BelongsTo
{
    return $this->belongsTo(Division::class);
}

public function grade(): BelongsTo
{
    return $this->belongsTo(Grade::class);
}

public function supervisor(): BelongsTo
{
    return $this->belongsTo(Employee::class, 'reports_to');
}

public function subordinates(): HasMany
{
    return $this->hasMany(Employee::class, 'reports_to');
}

public function emergencyContacts(): HasMany
{
    return $this->hasMany(EmergencyContact::class);
}

public function lifecycleEvents(): HasMany
{
    return $this->hasMany(\Modules\EmployeeLifecycle\Models\LifecycleEvent::class);
}
```
- **Validasi:** `php artisan tinker` → `Employee::first()->division` tidak error

### Step 1.3: Update EmployeeController
- **File:** `Modules/Employee/app/Http/Controllers/EmployeeController.php` [MODIFY]
- **Aksi:** MODIFY
- **Detail:**
  - Method `index()`: Tambah eager load `division`, `grade`, `supervisor`
  - Method `store()`: Tambah validasi field baru
  - Method `show()`: Tambah eager load `emergencyContacts`, `division`, `grade`, `supervisor`, `subordinates`
  - Method `update()`: Tambah validasi field baru

### Step 1.4: Update Employee Factory
- **File:** `Modules/Employee/database/factories/EmployeeFactory.php` [MODIFY]
- **Aksi:** MODIFY
- **Detail:** Tambah semua field baru ke `definition()` dengan faker yang sesuai

---

## Fase 1, Step 2: Model EmergencyContact

### Step 2.1: Buat Migration
- **File:** `Modules/Employee/database/migrations/2026_06_25_000002_create_emergency_contacts_table.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
```php
Schema::create('emergency_contacts', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('employee_id');
    $table->string('name');
    $table->string('relationship', 50); // spouse, parent, sibling, child, other
    $table->string('phone', 20);
    $table->string('email')->nullable();
    $table->text('address')->nullable();
    $table->boolean('is_primary')->default(false);
    $table->timestamps();
    $table->softDeletes();
    $table->uuid('created_by')->nullable();
    $table->uuid('updated_by')->nullable();
    $table->uuid('deleted_by')->nullable();
    $table->integer('version')->default(1);

    $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
});
```

### Step 2.2: Buat Model
- **File:** `Modules/Employee/app/Models/EmergencyContact.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
```php
namespace Modules\Employee\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmergencyContact extends BaseModel
{
    protected $fillable = [
        'employee_id', 'name', 'relationship', 'phone', 'email',
        'address', 'is_primary',
        'created_by', 'updated_by', 'deleted_by', 'version',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
```

### Step 2.3: Buat Controller
- **File:** `Modules/Employee/app/Http/Controllers/EmergencyContactController.php` [NEW]
- **Aksi:** CREATE
- **Detail:** CRUD standar nested under employee: `GET/POST /employees/{employee}/emergency-contacts`, `PUT/DELETE /employees/{employee}/emergency-contacts/{id}`

### Step 2.4: Tambah Route
- **File:** `Modules/Employee/routes/api.php` [MODIFY]
- **Aksi:** MODIFY
- **Detail:**
```php
Route::apiResource('employees.emergency-contacts', EmergencyContactController::class)
    ->parameters(['emergency-contacts' => 'emergencyContact']);
```

### Step 2.5: Buat Factory
- **File:** `Modules/Employee/database/factories/EmergencyContactFactory.php` [NEW]

### Step 2.6: Buat Unit Test
- **File:** `Modules/Employee/tests/Unit/EmergencyContactTest.php` [NEW]
- **Detail:** Test relasi, CRUD, is_primary uniqueness

---

## Fase 1, Step 3: Model CostCenter

### Step 3.1: Buat Migration
- **File:** `Modules/Organization/database/migrations/2026_06_25_000001_create_cost_centers_table.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
```php
Schema::create('cost_centers', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('code', 20)->unique();
    $table->string('name');
    $table->text('description')->nullable();
    $table->uuid('company_id')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
    $table->uuid('created_by')->nullable();
    $table->uuid('updated_by')->nullable();
    $table->uuid('deleted_by')->nullable();
    $table->integer('version')->default(1);

    $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
});
```

### Step 3.2: Buat Model
- **File:** `Modules/Organization/app/Models/CostCenter.php` [NEW]
- **Detail:**
```php
namespace Modules\Organization\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CostCenter extends BaseModel
{
    protected $fillable = [
        'code', 'name', 'description', 'company_id', 'is_active',
        'created_by', 'updated_by', 'deleted_by', 'version',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
```

### Step 3.3: Buat Controller
- **File:** `Modules/Organization/app/Http/Controllers/CostCenterController.php` [NEW]
- **Detail:** CRUD standar: `GET/POST /cost-centers`, `GET/PUT/DELETE /cost-centers/{id}`

### Step 3.4: Tambah Route
- **File:** `Modules/Organization/routes/api.php` [MODIFY]
- **Detail:** `Route::apiResource('cost-centers', CostCenterController::class);`

### Step 3.5: Buat Factory & Unit Test
- **File:** `Modules/Organization/database/factories/CostCenterFactory.php` [NEW]
- **File:** `Modules/Organization/tests/Unit/CostCenterTest.php` [NEW]

### Step 3.6: Frontend — Tambah Tab Cost Center
- **File:** `apps/web/src/features/organization/components/cost-center-tab.tsx` [NEW]
- **File:** `apps/web/src/app/organization/page.tsx` [MODIFY] — Tambah tab "Cost Center" ke tab list
- **Detail:** Tabel list (code, name, company, status), modal add/edit, toggle active
- **i18n:** Tambah namespace `organization.costCenter` ke `en.json` dan `id.json`

---

## Fase 1, Step 4: Modul EmployeeLifecycle [NEW]

### Step 4.1: Scaffold Module
- **Aksi:** Buat folder structure manual:
```
Modules/EmployeeLifecycle/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── LifecycleEventController.php
│   │       └── OnboardingChecklistController.php
│   ├── Models/
│   │   ├── LifecycleEvent.php
│   │   └── OnboardingChecklist.php
│   └── Providers/
│       ├── EmployeeLifecycleServiceProvider.php
│       └── RouteServiceProvider.php
├── config/
│   └── config.php
├── database/
│   ├── factories/
│   │   ├── LifecycleEventFactory.php
│   │   └── OnboardingChecklistFactory.php
│   ├── migrations/
│   │   ├── 2026_06_25_000010_create_lifecycle_events_table.php
│   │   └── 2026_06_25_000011_create_onboarding_checklists_table.php
│   └── seeders/
│       └── EmployeeLifecycleDatabaseSeeder.php
├── routes/
│   └── api.php
├── tests/
│   └── Unit/
│       └── LifecycleEventTest.php
├── composer.json
└── module.json
```

### Step 4.2: Migration — lifecycle_events
- **File:** `Modules/EmployeeLifecycle/database/migrations/2026_06_25_000010_create_lifecycle_events_table.php` [NEW]
- **Detail:**
```php
Schema::create('lifecycle_events', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('employee_id');
    $table->string('event_type', 30); // promotion, mutation, demotion, resignation, termination, retirement, contract_renewal, status_change
    $table->date('effective_date');
    $table->uuid('from_position_id')->nullable();
    $table->uuid('to_position_id')->nullable();
    $table->uuid('from_department_id')->nullable();
    $table->uuid('to_department_id')->nullable();
    $table->uuid('from_branch_id')->nullable();
    $table->uuid('to_branch_id')->nullable();
    $table->uuid('from_division_id')->nullable();
    $table->uuid('to_division_id')->nullable();
    $table->uuid('from_grade_id')->nullable();
    $table->uuid('to_grade_id')->nullable();
    $table->string('from_status', 20)->nullable();
    $table->string('to_status', 20)->nullable();
    $table->decimal('from_salary', 15, 2)->nullable();
    $table->decimal('to_salary', 15, 2)->nullable();
    $table->text('reason')->nullable();
    $table->text('notes')->nullable();
    $table->uuid('approved_by')->nullable();
    $table->date('approved_at')->nullable();
    $table->string('document_path')->nullable();
    $table->string('status', 20)->default('draft'); // draft, pending_approval, approved, rejected, executed
    $table->timestamps();
    $table->softDeletes();
    $table->uuid('created_by')->nullable();
    $table->uuid('updated_by')->nullable();
    $table->uuid('deleted_by')->nullable();
    $table->integer('version')->default(1);

    $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
    $table->foreign('from_position_id')->references('id')->on('positions')->nullOnDelete();
    $table->foreign('to_position_id')->references('id')->on('positions')->nullOnDelete();
    $table->foreign('from_department_id')->references('id')->on('departments')->nullOnDelete();
    $table->foreign('to_department_id')->references('id')->on('departments')->nullOnDelete();
    $table->foreign('from_branch_id')->references('id')->on('branches')->nullOnDelete();
    $table->foreign('to_branch_id')->references('id')->on('branches')->nullOnDelete();
});
```

### Step 4.3: Migration — onboarding_checklists
- **File:** `Modules/EmployeeLifecycle/database/migrations/2026_06_25_000011_create_onboarding_checklists_table.php` [NEW]
- **Detail:**
```php
Schema::create('onboarding_checklists', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('employee_id');
    $table->string('category', 30); // document, equipment, account, orientation, training
    $table->string('task_name');
    $table->text('description')->nullable();
    $table->boolean('is_completed')->default(false);
    $table->timestamp('completed_at')->nullable();
    $table->uuid('assigned_to')->nullable(); // user_id responsible
    $table->date('due_date')->nullable();
    $table->integer('sort_order')->default(0);
    $table->timestamps();
    $table->softDeletes();
    $table->uuid('created_by')->nullable();
    $table->uuid('updated_by')->nullable();
    $table->uuid('deleted_by')->nullable();
    $table->integer('version')->default(1);

    $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
});
```

### Step 4.4: Models
- **File:** `Modules/EmployeeLifecycle/app/Models/LifecycleEvent.php` [NEW]
- **File:** `Modules/EmployeeLifecycle/app/Models/OnboardingChecklist.php` [NEW]
- **Detail:** Standard BaseModel, fillable sesuai migration, casts (dates, booleans, decimals), relasi ke Employee, Position, Department, Branch

### Step 4.5: Controllers
- **File:** `Modules/EmployeeLifecycle/app/Http/Controllers/LifecycleEventController.php` [NEW]
  - `index()`: List lifecycle events, filter by employee_id, event_type, date range
  - `store()`: Buat event baru (draft), validasi employee_id exists
  - `show()`: Detail event dengan relasi
  - `update()`: Update event draft
  - `destroy()`: Soft delete
  - `execute()`: Custom method POST `/lifecycle-events/{id}/execute` — Jalankan event (update employee data berdasarkan to_* fields)
- **File:** `Modules/EmployeeLifecycle/app/Http/Controllers/OnboardingChecklistController.php` [NEW]
  - CRUD nested: `/employees/{employee}/onboarding`
  - `complete()`: PATCH `/employees/{employee}/onboarding/{id}/complete` — Toggle complete

### Step 4.6: Routes
- **File:** `Modules/EmployeeLifecycle/routes/api.php` [NEW]
```php
Route::middleware(['api', 'auth:api'])->prefix('api/v1')->group(function () {
    Route::apiResource('lifecycle-events', LifecycleEventController::class);
    Route::post('lifecycle-events/{lifecycleEvent}/execute', [LifecycleEventController::class, 'execute']);
    Route::apiResource('employees.onboarding', OnboardingChecklistController::class)
        ->parameters(['onboarding' => 'onboardingChecklist']);
    Route::patch('employees/{employee}/onboarding/{onboardingChecklist}/complete',
        [OnboardingChecklistController::class, 'complete']);
});
```

### Step 4.7: Service Provider & module.json
- **File:** `Modules/EmployeeLifecycle/app/Providers/EmployeeLifecycleServiceProvider.php` [NEW]
- **File:** `Modules/EmployeeLifecycle/app/Providers/RouteServiceProvider.php` [NEW]
- **File:** `Modules/EmployeeLifecycle/module.json` [NEW]
- **File:** `Modules/EmployeeLifecycle/composer.json` [NEW]
- **Detail:** Ikuti pola dari modul existing (misal: Training module)
- Update `modules_statuses.json`: tambah `"EmployeeLifecycle": true`

### Step 4.8: Factories & Unit Test
- **File:** `Modules/EmployeeLifecycle/database/factories/LifecycleEventFactory.php` [NEW]
- **File:** `Modules/EmployeeLifecycle/database/factories/OnboardingChecklistFactory.php` [NEW]
- **File:** `Modules/EmployeeLifecycle/tests/Unit/LifecycleEventTest.php` [NEW]
  - Test: relasi, event_type enum validation, execute flow (employee data updated)

### Step 4.9: Permission Seeder
- **File:** `Modules/EmployeeLifecycle/database/seeders/EmployeeLifecycleDatabaseSeeder.php` [NEW]
- **Detail:** Seed permissions: `lifecycle_event.view`, `lifecycle_event.create`, `lifecycle_event.update`, `lifecycle_event.delete`, `lifecycle_event.execute`, `onboarding.view`, `onboarding.create`, `onboarding.update`, `onboarding.delete`, `onboarding.complete`

---

## Fase 1, Step 5: Organization Chart (Interaktif DnD)

### Step 5.1: Frontend — OrgChart Component
- **File:** `apps/web/src/features/organization/components/org-chart.tsx` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Menggunakan data dari API `GET /employees?include=subordinates,position,department`
  - Render tree visual (dari `reports_to` hierarchy)
  - Setiap node menampilkan: foto, nama, jabatan, departemen
  - **Drag-and-drop**: Seret karyawan ke posisi lain → auto-create LifecycleEvent (mutation) via `POST /lifecycle-events`
  - Gunakan library: `@dnd-kit/core` + custom tree renderer (atau `reactflow` untuk visualisasi graph)
  - Responsive: horizontal scroll untuk org besar
- **i18n:** Tambah keys `organization.orgChart.*` ke en.json dan id.json

### Step 5.2: Frontend — Tambah Tab/Page OrgChart
- **File:** `apps/web/src/app/organization/page.tsx` [MODIFY]
- **Detail:** Tambah tab "Organization Chart" yang merender `<OrgChart />` component

---

## Fase 1, Step 6: Employee Timeline

### Step 6.1: Frontend — Timeline Component
- **File:** `apps/web/src/features/employees/components/employee-timeline.tsx` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Fetch lifecycle events: `GET /lifecycle-events?employee_id={id}&sort=-effective_date`
  - Render sebagai vertical timeline (tanggal + event type + detail dari→ke)
  - Icon per event type: 🎉 promotion, 🔄 mutation, ⬇️ demotion, 👋 resignation, etc.
- **i18n:** Tambah keys `employees.timeline.*` ke en.json dan id.json

### Step 6.2: Tambah Tab di Employee Detail
- **File:** `apps/web/src/app/employees/[id]/page.tsx` [MODIFY]
- **Detail:** Tambah tab "Timeline" yang merender `<EmployeeTimeline employeeId={id} />`

---

## Fase 1, Step 7: Frontend — Employee Lifecycle Pages

### Step 7.1: Landing Page
- **File:** `apps/web/src/app/employee-lifecycle/page.tsx` [NEW]
- **Detail:**
  - Dashboard metrics: jumlah promotion bulan ini, mutation, resignation, pending onboarding
  - Quick links ke sub-pages
  - Back button ke Dashboard

### Step 7.2: Lifecycle Events List
- **File:** `apps/web/src/app/employee-lifecycle/events/page.tsx` [NEW]
- **Detail:**
  - Table: employee name, event type, effective date, from→to (position/dept), status
  - Filter: event_type, date range, status
  - Modal: create new event, execute event

### Step 7.3: Onboarding Management
- **File:** `apps/web/src/app/employee-lifecycle/onboarding/page.tsx` [NEW]
- **Detail:**
  - List karyawan baru yang masih dalam proses onboarding
  - Checklist per karyawan (category → tasks → toggle complete)
  - Progress bar per karyawan

### Step 7.4: i18n
- **File:** `apps/web/messages/en.json` [MODIFY] — Tambah namespace `lifecycle`
- **File:** `apps/web/messages/id.json` [MODIFY] — Tambah namespace `lifecycle`

### Step 7.5: Dashboard & AppLauncher
- **File:** `apps/web/src/app/dashboard/page.tsx` [MODIFY] — Tambah menu Employee Lifecycle di mega menu
- **File:** `apps/web/src/components/AppLauncherOverlay.tsx` [MODIFY] — Tambah entry

---

## Checklist Verifikasi Fase 1

- [ ] `php artisan migrate` berhasil (semua migration baru)
- [ ] `php artisan test` — semua test hijau
- [ ] API endpoint baru berfungsi (Postman/curl test)
- [ ] Frontend: tab Cost Center di Organization berfungsi
- [ ] Frontend: Org Chart render dengan data, DnD mutation bekerja
- [ ] Frontend: Employee detail — tab Timeline menampilkan events
- [ ] Frontend: `/employee-lifecycle` — landing + events + onboarding berfungsi
- [ ] `npm run build` — zero errors
- [ ] i18n: semua string EN + ID tersedia
- [ ] Permission seeder berjalan
