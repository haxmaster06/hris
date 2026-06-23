# Planning: Organization Module CRUD APIs & Pattern Setup

## Ringkasan
Dokumen ini mendefinisikan rencana implementasi teknis untuk CRUD APIs dan setup pattern pada **Modules/Organization** di Universal HRIS Platform (Nexus HR). Implementasi ini mengikuti standar arsitektur bersih (*Clean Architecture*) Laravel: Controller -> Form Request & API Resource -> Service -> Repository -> Model.

## Referensi Dokumen
- PRD 1: [Foundation Architecture](file:///d:/HBM/Project/HRIS/docs/PRD/1.Foundation_Architecture.md)
- PRD 3: [Database and API](file:///d:/HBM/Project/HRIS/docs/PRD/3.Database_and_API.md)
- Backend Patterns: [laravel-patterns.md](file:///C:/Users/masti/.gemini/antigravity-ide/knowledge/hris-backend-patterns/artifacts/laravel-patterns.md)

## Kondisi Existing (Current State)
- Modul `Organization` telah terbuat dan diautoload.
- Migrasi database dan model-model Eloquent (`Company`, `Branch`, `Department`, `Division`, `Position`, `Grade`) telah terimplementasi dan lolos pengujian Unit.
- Belum ada kelas Repository, Service, Form Request, API Resource, Route, atau Controller untuk melayani operasi REST CRUD.
- Tes API (Feature Test) untuk endpoint organisasi belum tersedia.

## Desired State
- RESTful CRUD APIs yang fully functional dan teruji untuk seluruh entitas organisasi:
  - `Company`: `/api/v1/companies`
  - `Branch`: `/api/v1/branches`
  - `Department`: `/api/v1/departments` (dengan validasi anti circular reference)
  - `Division`: `/api/v1/divisions`
  - `Position`: `/api/v1/positions`
  - `Grade`: `/api/v1/grades`
- Seluruh endpoint di atas terproteksi oleh middleware `InitializeTenancy` dan auth guard `auth:api` (JWT).
- Feature tests mencakup skenario pembuatan (create), pembacaan (read/list), perubahan (update), dan penghapusan (soft delete) untuk setiap entitas, serta validasi hak akses dan input.

---

## Fase 1: Setup Repositories & Services

### Step 1.1: Pembuatan Repository Interface dan Implementasi
- **Modul:** Organization
- **File:**
  - `apps/api/Modules/Organization/app/Repositories/CompanyRepositoryInterface.php` [NEW]
  - `apps/api/Modules/Organization/app/Repositories/CompanyRepository.php` [NEW]
  - `apps/api/Modules/Organization/app/Repositories/BranchRepositoryInterface.php` [NEW]
  - `apps/api/Modules/Organization/app/Repositories/BranchRepository.php` [NEW]
  - `apps/api/Modules/Organization/app/Repositories/DepartmentRepositoryInterface.php` [NEW]
  - `apps/api/Modules/Organization/app/Repositories/DepartmentRepository.php` [NEW]
  - `apps/api/Modules/Organization/app/Repositories/DivisionRepositoryInterface.php` [NEW]
  - `apps/api/Modules/Organization/app/Repositories/DivisionRepository.php` [NEW]
  - `apps/api/Modules/Organization/app/Repositories/PositionRepositoryInterface.php` [NEW]
  - `apps/api/Modules/Organization/app/Repositories/PositionRepository.php` [NEW]
  - `apps/api/Modules/Organization/app/Repositories/GradeRepositoryInterface.php` [NEW]
  - `apps/api/Modules/Organization/app/Repositories/GradeRepository.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Standard interface mencakup method `paginate(int $perPage, array $filters)`, `findOrFail(string $id)`, `create(array $data)`, `update(string $id, array $data)`, dan `delete(string $id)`.
  - Implementasi repository menggunakan model masing-masing dengan filter pencarian (`search`) dan sorting data.

### Step 1.2: Pembuatan Repository Service Provider & Register Bindings
- **Modul:** Organization
- **File:**
  - `apps/api/Modules/Organization/app/Providers/RepositoryServiceProvider.php` [NEW]
  - `apps/api/Modules/Organization/app/Providers/OrganizationServiceProvider.php` [MODIFY]
- **Aksi:** CREATE / MODIFY
- **Detail:**
  - Daftarkan binding singleton antara Interface dan kelas konkret Repositories.
  - Daftarkan `RepositoryServiceProvider` di `$providers` array pada `OrganizationServiceProvider.php`.

### Step 1.3: Pembuatan Services Layer
- **Modul:** Organization
- **File:**
  - `apps/api/Modules/Organization/app/Services/CompanyService.php` [NEW]
  - `apps/api/Modules/Organization/app/Services/BranchService.php` [NEW]
  - `apps/api/Modules/Organization/app/Services/DepartmentService.php` [NEW]
  - `apps/api/Modules/Organization/app/Services/DivisionService.php` [NEW]
  - `apps/api/Modules/Organization/app/Services/PositionService.php` [NEW]
  - `apps/api/Modules/Organization/app/Services/GradeService.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Membungkus operasi database di dalam `DB::transaction()`.
  - Menangani business logic khusus. Terutama pada `DepartmentService`, buat logic `checkCircularReference(string $departmentId, ?string $parentId)` untuk mencegah relasi parent berputar yang akan memicu infinite loop.

---

## Fase 2: Form Requests, API Resources & Controllers

### Step 2.1: Pembuatan Form Requests (Validation)
- **Modul:** Organization
- **File:**
  - Requests untuk masing-masing Model (Create & Update) di folder `apps/api/Modules/Organization/app/Http/Requests/`:
    - `Company/CreateCompanyRequest.php`, `Company/UpdateCompanyRequest.php` [NEW]
    - `Branch/CreateBranchRequest.php`, `Branch/UpdateBranchRequest.php` [NEW]
    - `Department/CreateDepartmentRequest.php`, `Department/UpdateDepartmentRequest.php` [NEW]
    - `Division/CreateDivisionRequest.php`, `Division/UpdateDivisionRequest.php` [NEW]
    - `Position/CreatePositionRequest.php`, `Position/UpdatePositionRequest.php` [NEW]
    - `Grade/CreateGradeRequest.php`, `Grade/UpdateGradeRequest.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Validasi ketat tipe data, panjang string, dan keunikan `code` (untuk update, abaikan ID yang sedang diubah).
  - Validasi foreign key relasi model yang valid.

### Step 2.2: Pembuatan API Resources & Collections (Formatting JSON)
- **Modul:** Organization
- **File:**
  - Resources & Collections di folder `apps/api/Modules/Organization/app/Http/Resources/`:
    - `CompanyResource.php`, `CompanyCollection.php` [NEW]
    - `BranchResource.php`, `BranchCollection.php` [NEW]
    - `DepartmentResource.php`, `DepartmentCollection.php` [NEW]
    - `DivisionResource.php`, `DivisionCollection.php` [NEW]
    - `PositionResource.php`, `PositionCollection.php` [NEW]
    - `GradeResource.php`, `GradeCollection.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Mentransformasi record database ke JSON payload standard.
  - Mendukung payload relasi opsional (e.g. `company` di branch, `parent` di department).

### Step 2.3: Pembuatan Controllers
- **Modul:** Organization
- **File:**
  - `apps/api/Modules/Organization/app/Http/Controllers/CompanyController.php` [NEW]
  - `apps/api/Modules/Organization/app/Http/Controllers/BranchController.php` [NEW]
  - `apps/api/Modules/Organization/app/Http/Controllers/DepartmentController.php` [NEW]
  - `apps/api/Modules/Organization/app/Http/Controllers/DivisionController.php` [NEW]
  - `apps/api/Modules/Organization/app/Http/Controllers/PositionController.php` [NEW]
  - `apps/api/Modules/Organization/app/Http/Controllers/GradeController.php` [NEW]
  - `apps/api/Modules/Organization/app/Http/Controllers/OrganizationController.php` [DELETE]
- **Aksi:** CREATE / DELETE
- **Detail:**
  - Setiap controller meng-extend `App\Http\Controllers\BaseController` dan menyuntikkan Service masing-masing secara dependency injection.
  - Mengembalikan response JSON standar via helper method di `BaseController`.
  - Hapus `OrganizationController.php` bawaan scaffolding modular yang tidak terpakai.

---

## Fase 3: Routing & Testing

### Step 3.1: Konfigurasi API Routing
- **Modul:** Organization
- **File:**
  - `apps/api/Modules/Organization/routes/api.php` [MODIFY]
- **Aksi:** MODIFY
- **Detail:**
  - Definisikan route grup API v1 dengan middleware `[\App\Http\Middleware\InitializeTenancy::class, 'auth:api']`.
  - Daftarkan `apiResource` untuk: `companies`, `branches`, `departments`, `divisions`, `positions`, `grades`.

### Step 3.2: Penulisan API CRUD Feature Tests
- **Modul:** Organization
- **File:**
  - `apps/api/Modules/Organization/tests/Feature/CompanyApiTest.php` [NEW]
  - `apps/api/Modules/Organization/tests/Feature/BranchApiTest.php` [NEW]
  - `apps/api/Modules/Organization/tests/Feature/DepartmentApiTest.php` [NEW]
  - `apps/api/Modules/Organization/tests/Feature/DivisionApiTest.php` [NEW]
  - `apps/api/Modules/Organization/tests/Feature/PositionApiTest.php` [NEW]
  - `apps/api/Modules/Organization/tests/Feature/GradeApiTest.php` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Setiap file test meng-extend `Tests\TestCase` dan menggunakan trait `DatabaseMigrations`.
  - Melakukan autentikasi menggunakan token JWT.
  - Mengirim data valid dan tidak valid, memverifikasi response status (200, 201, 400, 422, 403, 404).
  - Melakukan pengujian edge case seperti circular dependency pada department, validasi minimal/maksimal salary pada grade, dan limit filter paging.

---

## Checklist Verifikasi Akhir
- [ ] Seluruh repository terdaftar dan terikat (*bound*) dengan benar di Service Container.
- [ ] API routes terdaftar di routing table Laravel (`php artisan route:list`).
- [ ] Endpoint CRUD dapat diakses dan dioperasikan.
- [ ] Circular reference pada department mengembalikan status 422 (Unprocessable Entity).
- [ ] Seluruh unit/feature tests di modul Organization berstatus HIJAU (`passed`) dengan cakupan kode >= 80%.
- [ ] Tidak ada regresi pada tes IAM/Authentication yang sudah ada.
