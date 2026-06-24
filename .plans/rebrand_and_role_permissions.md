# Implementation Plan: Rebranding Landlord & Modul Organization, Super Admin Restrictions, and Roles & Permissions

## Ringkasan
Dokumen ini merinci langkah-langkah implementasi untuk:
1. Rebrand **"Landlord Console"** menjadi **"High Level Control"** dan membatasi aksesnya hanya untuk user dengan role `Super Admin`.
2. Menghindari kebingungan istilah dengan mengganti nama tab **"Company"** di dalam Modul Organization menjadi **"Legal Entity (Entitas Legal)"**.
3. Menambahkan restriksi keamanan di backend dan frontend agar user dengan role di bawah `Super Admin` tidak bisa membuat, mengubah, atau menghapus user `Super Admin`.
4. Mengimplementasikan fitur **Role & Permission Management** lengkap (CRUD Role dan mapping Spatie Permission) di backend API dan Next.js frontend UI.

---

## Kondisi Existing (Current State)
1. **Landlord Console**: Dapat diakses di `/landlord` dengan memvalidasi token rahasia (`nexus_central_token`) yang disimpan di `sessionStorage`. Akses belum dibatasi secara ketat berdasarkan role JWT user yang sedang login.
2. **Modul Organization**: Memiliki tab "Companies" yang menampilkan legal entities internal (tabel `companies` di schema tenant). Hal ini membingungkan karena ada istilah "Company" (Tenant) di level Landlord.
3. **Super Admin Management**: Modifikasi user di `/users` menggunakan endpoint `UserController`. Validasi PIN `444329` sudah ada, namun role non-Super Admin (misal: HR Manager) secara teori masih bisa memicu modifikasi/pembuatan akun Super Admin jika mengetahui PIN tersebut.
4. **Roles & Permissions**: Endpoint `/roles` hanya menyajikan fungsi `index` sederhana. Belum ada manajemen CRUD role maupun penugasan Spatie Permission ke role tersebut via UI.

---

## Target Akhir (Desired State)
1. Halaman `/landlord` dipindah ke `/high-level-control` dan di-gate secara ketat. Hanya user dengan role `Super Admin` yang bisa masuk (diverifikasi di level client via `useAuthStore` dan di-gated pada menu launcher/dashboard).
2. Tab "Companies" di Organization Hub diganti namanya menjadi "Legal Entity (Entitas Legal)". Semua input dropdown/form onboarding karyawan (Employee) yang bertuliskan "Company" disesuaikan menjadi "Legal Entity (Entitas Legal)".
3. Request ke `UserController` untuk `store`, `update`, dan `destroy` yang menargetkan user dengan role `Super Admin` atau mencoba memberikan role `Super Admin` akan diblokir dengan `403 Forbidden` jika pembuat request bukan `Super Admin`.
4. Tab baru "Roles & Permissions" ditambahkan pada halaman `/users`. Fitur ini mencakup:
   - CRUD Role (Nama Role) dengan pengecualian role bawaan (`Super Admin`, `HR Manager`, `Employee` tidak bisa diubah namanya atau dihapus).
   - Mapping permissions Spatie menggunakan antarmuka accordion/collapsible list yang terorganisir per modul, menggunakan emoji visual, dan text label yang tidak terpotong (melentur/wrap).

---

## Fase 1: Perubahan Backend (API)

### Step 1.1: Restriksi Pembuatan/Perubahan Super Admin di UserController
- **Modul:** Core / IAM
- **File:** [UserController.php](file:///d:/HBM/Project/HRIS/apps/api/app/Http/Controllers/Tenant/UserController.php)
- **Aksi:** MODIFY
- **Detail:**
  - Tambahkan pengecekan role pembuat request (`auth()->user()->hasRole('Super Admin')`).
  - Di `store()`: Jika input `roles` mengandung `'Super Admin'`, dan pembuat request bukan Super Admin, kembalikan `403 Forbidden`.
  - Di `update()`: Jika user target memiliki role `'Super Admin'` ATAU input `roles` mengandung `'Super Admin'`, dan pembuat request bukan Super Admin, kembalikan `403 Forbidden`.
  - Di `destroy()`: Jika user target memiliki role `'Super Admin'`, kembalikan `403 Forbidden`.
- **Validasi:** Unit test & request API via Postman/Client mengembalikan error 403 saat non-Super Admin mencoba memodifikasi data Super Admin.

### Step 1.2: Implementasi CRUD Lengkap pada RoleController
- **Modul:** Core / IAM
- **File:** [RoleController.php](file:///d:/HBM/Project/HRIS/apps/api/app/Http/Controllers/Tenant/RoleController.php)
- **Aksi:** MODIFY
- **Detail:**
  - Tambahkan method `store(Request $request)`: Membuat role baru dan melakukan sinkronisasi permissions.
  - Tambahkan method `show(string $id)`: Mengambil satu record role beserta daftar nama permissions yang dimilikinya (`$role->permissions->pluck('name')`).
  - Tambahkan method `update(Request $request, string $id)`: Memperbarui nama role (kecuali default roles) dan menyinkronkan permissions baru.
  - Tambahkan method `destroy(string $id)`: Menghapus role (blokir jika role adalah default: `'Super Admin'`, `'HR Manager'`, `'Employee'`).
  - Update `index()` agar opsional menyertakan data permissions per role.
- **Validasi:** Endpoint GET/POST/PUT/DELETE `/api/v1/roles` berjalan dengan benar.

### Step 1.3: Pembuatan PermissionController
- **Modul:** Core / IAM
- **File:** [PermissionController.php](file:///d:/HBM/Project/HRIS/apps/api/app/Http/Controllers/Tenant/PermissionController.php) [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Class `PermissionController` mewarisi `BaseController`.
  - Implementasikan method `index()` yang mengambil seluruh data permissions dari tabel `permissions` untuk memetakan opsi pada frontend.
- **Validasi:** Endpoint GET `/api/v1/permissions` mengembalikan seluruh permissions.

### Step 1.4: Registrasi Route Backend Baru
- **Modul:** Core / IAM
- **File:** [tenant.php](file:///d:/HBM/Project/HRIS/apps/api/routes/tenant.php)
- **Aksi:** MODIFY
- **Detail:**
  - Ubah `Route::get('roles', ...)` menjadi `Route::apiResource('roles', \App\Http\Controllers\Tenant\RoleController::class);`
  - Tambahkan `Route::get('permissions', [\App\Http\Controllers\Tenant\PermissionController::class, 'index']);`
- **Validasi:** Route terdaftar saat menjalankan `php artisan route:list`.

---

## Fase 2: Perubahan Frontend (Web)

### Step 2.1: Rebrand Landlord ke High Level Control
- **Modul:** Central Console
- **File & Folder:**
  - Rename folder [landlord](file:///d:/HBM/Project/HRIS/apps/web/src/app/landlord) menjadi [high-level-control](file:///d:/HBM/Project/HRIS/apps/web/src/app/high-level-control).
  - Edit [page.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/high-level-control/page.tsx):
    - Rebrand semua text: "Landlord Console" -> "High Level Control Portal", "Landlord Administrator Console" -> "High Level Control Console", "Landlord Active" -> "System Control Active".
    - Tambahkan client-side authorization: Cek `user?.roles?.includes("Super Admin")`. Jika bukan Super Admin, redirect ke `/dashboard` dan munculkan pesan error.
  - Edit [AppLauncherOverlay.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/components/AppLauncherOverlay.tsx) & [dashboard/page.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/dashboard/page.tsx):
    - Ubah title: "Landlord Console (Tenant Setup)" -> "High Level Control"
    - Ubah href: `/landlord` -> `/high-level-control`
- **Validasi:** URL `/high-level-control` dapat diakses oleh Super Admin, tetapi memblokir / me-redirect HR Manager atau Employee.

### Step 2.2: Spesifikasi Istilah Modul Organization (Legal Entity)
- **Modul:** Organization
- **File:**
  - [organization/page.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/organization/page.tsx)
  - [company-tab.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/features/organization/components/company-tab.tsx)
  - [branch-tab.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/features/organization/components/branch-tab.tsx)
  - [employee-form-modal.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/features/employees/components/employee-form-modal.tsx)
- **Aksi:** MODIFY
- **Detail:**
  - Di `organization/page.tsx`: Ganti nama label tab "Companies" -> "Legal Entities (Entitas Legal)".
  - Di `company-tab.tsx`:
    - Ganti judul/label "Company" -> "Legal Entity (Entitas Legal)".
    - Ganti tombol "Add Company" -> "Add Legal Entity".
    - Ganti modal title "Add New Company" / "Edit Company" -> "Add New Legal Entity" / "Edit Legal Entity".
    - Ganti field label "Company Code" / "Company Name" -> "Legal Entity Code" / "Legal Entity Name".
    - Sesuaikan toast message pendukung.
  - Di `branch-tab.tsx`:
    - Ganti label filter dropdown "All Companies" -> "All Legal Entities".
    - Ganti select option "Select Company" -> "Select Legal Entity".
    - Ganti label kolom "Company" -> "Legal Entity".
  - Di `employee-form-modal.tsx`:
    - Ganti label "Company" -> "Legal Entity (Entitas Legal)".
- **Validasi:** Halaman UI bebas dari istilah "Company" yang rancu dengan tenant setup central, digantikan secara presisi oleh "Legal Entity (Entitas Legal)".

### Step 2.3: Fitur Management Role & Permission (Tab Baru di `/users`)
- **Modul:** Security / RBAC
- **File:** [users/page.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/users/page.tsx)
- **Aksi:** MODIFY
- **Detail:**
  - Transformasi halaman `/users` menjadi tab-based layout:
    - Tab 1: **User Accounts** (UI user CRUD yang sudah ada).
    - Tab 2: **Roles & Permissions** [NEW TAB].
  - Desain UI **Roles & Permissions Tab**:
    - Tabel daftar Role (menampilkan Nama Role dan list badge permission utama).
    - Aksi Edit dan Delete pada masing-masing role (Tombol delete dinonaktifkan untuk default roles: Super Admin, HR Manager, Employee).
    - Tombol "Add Role" yang memicu Modal Form.
  - Desain **Modal Form Role (Create/Edit)**:
    - Input: Nama Role.
    - Opsi Permissions: Dikelompokkan ke dalam kategori berdasarkan prefiks nama permission (Core/IAM, Organization, Employee Profile, Attendance, Leave, Document, Analytics, Recruitment, Training).
    - Menggunakan komponen Accordion (Collapsible) untuk masing-masing kategori, ditutup secara default demi kerapihan.
    - Checkbox disusun secara vertikal (1 kolom per baris) agar label tidak terpotong (no truncate).
    - Gunakan emoji visual pada label checkbox:
      - 👁️ untuk `read` / `view`
      - ➕ untuk `create`
      - ✏️ untuk `update`
      - 🗑️ untuk `delete`
      - 📊 untuk `report`
    - Super Admin Role form dinonaktifkan dari perubahan nama / permission (selalu diset full access).
- **Validasi:** Tab Roles & Permissions berjalan secara interaktif, perubahan permissions tersimpan dengan sukses ke database melalui API.

---

## Verification Plan

### Automated Tests
- Jalankan test suite backend: `php artisan test`
- Buat unit test baru di backend untuk memvalidasi restriksi role Super Admin:
  - Non-Super Admin dilarang membuat user dengan role Super Admin.
  - Non-Super Admin dilarang mengedit user ber-role Super Admin.

### Manual Verification
- Login sebagai Super Admin:
  - Buka `/high-level-control`, pastikan konsol terbuka.
  - Buka `/users`, masuk to tab "Roles & Permissions", coba buat role baru, edit, dan hapus.
- Login sebagai HR Manager (Non-Super Admin):
  - Buka `/high-level-control`, pastikan diredirect ke `/dashboard` dengan toast error.
  - Coba buat atau edit user dengan menugaskan role "Super Admin", pastikan API mengembalikan error dan UI menampilkan toast kegagalan.
  - Buka Organization Hub, pastikan label tab dan isinya tertulis "Legal Entity (Entitas Legal)".
