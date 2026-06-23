# Planning: Next.js Frontend MVP Foundation (Nexus HR)

## Ringkasan
Dokumen ini mendefinisikan rencana detail implementasi teknis untuk **Next.js Frontend MVP Foundation** dari proyek Universal HRIS Platform (Nexus HR). Tujuan dari fase ini adalah membangun antarmuka pengguna (UI) modern yang terintegrasi dengan backend Laravel 12 API. 

Sesuai aturan `RULE[modul-behaviour.md]`, antarmuka ini **tidak menggunakan sidebar atau side menu**, melainkan menggunakan **App Launcher** terpusat sebagai navigasi utama. Setiap modul akan memiliki dashboard/landing page sendiri dengan tombol kembali ke App Launcher, serta mematuhi standarisasi visual premium.

## Referensi Dokumen
- PRD 1: [Foundation Architecture](file:///d:/HBM/Project/HRIS/docs/PRD/1.Foundation_Architecture.md)
- PRD 2: [Functional Modules](file:///d:/HBM/Project/HRIS/docs/PRD/2.Functional_Modules.md)
- PRD 3: [Database and API](file:///d:/HBM/Project/HRIS/docs/PRD/3.Database_and_API.md)
- UI Mockups: [Mockup Directory](file:///d:/HBM/Project/HRIS/Mockup/)
- Aturan Modul: [modul-behaviour.md](file:///d:/HBM/Project/HRIS/.agent/rules/modul-behaviour.md)
- Aturan Visual: [overal-rule.md](file:///d:/HBM/Project/HRIS/.agent/rules/overal-rule.md)

## Kondisi Existing (Current State)
- Kode backend Laravel 12 API selesai 100% dan seluruh 67 unit/feature tests berjalan hijau (PASSED).
- Next.js 16.2.9 monorepo frontend (`apps/web`) telah diinisialisasi dengan TailwindCSS v4, Zustand, Axios, dan React Query.
- Font dasar menggunakan Geist Sans & Geist Mono, visual index halaman depan Next.js masih berupa halaman default Vercel template.
- Driver API client, state management global (Auth store), dan routing dynamic per tenant belum dikonfigurasi.

## Target Akhir (Desired State)
- Sistem otentikasi multi-tenant terintegrasi penuh. User dapat menginput `Tenant ID` (UUID/Slug) dan kredensial JWT.
- **App Launcher Dashboard** (Halaman Utama) berisi daftar aplikasi/modul yang dapat diakses dengan visual premium.
- Navigasi antar halaman modular bersih tanpa sidebar/side menu. Tersedia tombol kembali ke Launcher di setiap modul.
- Modul-modul MVP berjalan penuh:
  1. **IAM & Users**: Manajemen user dan hak akses.
  2. **Organization**: CRUD Branch, Department (visual tree), Division, Position, Grade.
  3. **Employee**: CRUD data karyawan, profile tabbed, karir history.
  4. **Attendance & Leave**: Check-in/out, status shift harian, pengajuan cuti, approval manager.
  5. **Documents & Reports**: Upload file ke MinIO/S3, signed URL, dan dashboard basic report dengan export CSV.

---

## Fase 1: API Client, State Management & Global Layout
### Step 1.1: Axios API Client & Interceptors
- **Modul:** Frontend Core
- **File:** `apps/web/src/lib/api.ts` [NEW]
- **Detail:**
  - Setup instance Axios dengan default `baseURL` mengarah ke `http://localhost:7030/api/v1`.
  - Pasang interceptor request untuk menyuntikkan header `X-Tenant-ID` dan `Authorization: Bearer <token>` dari Zustand store jika tersedia.
  - Pasang interceptor response untuk menangani error globally (misal: otomatis logout jika mendapat error 401 Unauthorized, menampilkan toast error dari `sonner`).

### Step 1.2: Zustand Auth & Theme Store
- **Modul:** Frontend Core
- **File:**
  - `apps/web/src/stores/authStore.ts` [NEW]
  - `apps/web/src/stores/themeStore.ts` [NEW]
- **Detail:**
  - `authStore`: Menyimpan token JWT (`accessToken`, `refreshToken`), detail profil user (`user`), dan ID tenant (`tenantId`). Mendukung aksi `setAuth`, `clearAuth`, dan persistensi data login di localStorage/cookies.
  - `themeStore`: Menyimpan status dark/light mode dan sinkronisasi class `.dark` ke elemen `html`.

### Step 1.3: React Query Provider Setup
- **Modul:** Frontend Core
- **File:** `apps/web/src/app/layout.tsx` [MODIFY]
- **Detail:**
  - Buat file `apps/web/src/components/providers.tsx` untuk membungkus QueryClientProvider, ThemeProvider, dan Toast Container (`Sonner`).
  - Bungkus `children` di `RootLayout` menggunakan provider tersebut.

---

## Fase 2: Otentikasi & Portal Login (M01)
### Step 2.1: Tenant Identification & Login Page
- **Modul:** Auth & Portal
- **File:** 
  - `apps/web/src/app/login/page.tsx` [NEW]
  - `apps/web/src/app/login/login-form.tsx` [NEW]
- **Detail:**
  - Mendesain login portal yang memukau (premium design) menggunakan grid modern, ilustrasi abstract, transisi smooth, dan support dark mode.
  - Form input: Tenant Slug/ID, Email, dan Password.
  - Panggil API `POST /auth/login`. Jika sukses, simpan kredensial ke Zustand dan redirect ke `/dashboard`.
- **Validasi:** Menguji login menggunakan user default seed (`admin@nexushr.local` / `admin123`) dan verifikasi kelancaran login.

---

## Fase 3: App Launcher Dashboard (Halaman Utama)
### Step 3.1: Dashboard App Launcher
- **Modul:** Navigation Core
- **File:** `apps/web/src/app/dashboard/page.tsx` [NEW]
- **Detail:**
  - Implementasi halaman utama dashboard berupa **App Launcher Grid** (tanpa sidebar/side menu).
  - Tampilan grid berisi kartu modul premium dengan micro-animations hover (skala membesar halus, shadow bergeser) dan icon representatif:
    - **IAM & Users** (Icon: Shield/UserCheck) -> `/iam`
    - **Organization** (Icon: Briefcase/GitPullRequest) -> `/organization`
    - **Employee Profile** (Icon: Users/Contact) -> `/employees`
    - **Attendance & Leave** (Icon: Calendar/Clock) -> `/attendance-leave`
    - **Documents & Reports** (Icon: FolderOpen/TrendingUp) -> `/documents-reports`
  - Header Global: Logo HBM HRIS, TenantSwitcher (jika admin landlord), User Profile (avatar + dropdown berisi Profile, Settings, dan Logout).

---

## Fase 4: Modul Organisasi (M02)
### Step 4.1: Dashboard Organisasi & Tabbed CRUD
- **Modul:** Organization UI
- **File:**
  - `apps/web/src/app/organization/page.tsx` [NEW]
  - `apps/web/src/features/organization/components/...` [NEW]
- **Detail:**
  - Landing page `/organization` menyajikan ringkasan metric (Total Perusahaan, Cabang, Departemen, Jabatan).
  - Tambahkan tombol kembali: **"<- Kembali ke Dashboard"** di header halaman.
  - Tabbed Layout menggunakan Shadcn Tabs:
    1. **Companies**: Tabel daftar perusahaan & form tambah/edit modal.
    2. **Branches**: Tabel cabang & form dengan selection company.
    3. **Departments**: Representasi visual berhierarki (Tree/Card list) dengan parent-child relation. Validasi UI untuk mencegah cycle parent-child.
    4. **Positions**: CRUD data jabatan terkait departemen.
    5. **Grades**: CRUD data golongan/grade gaji karyawan.

---

## Fase 5: Modul Data Karyawan (M03)
### Step 5.1: Directory Karyawan & Multi-step Form
- **Modul:** Employee UI
- **File:**
  - `apps/web/src/app/employees/page.tsx` [NEW]
  - `apps/web/src/app/employees/[id]/page.tsx` [NEW]
  - `apps/web/src/features/employees/components/...` [NEW]
- **Detail:**
  - Landing page `/employees` berisi dashboard data karyawan: total staff, sebaran status kerja (probation, contract, permanent), dan tabel direktori karyawan.
  - Fitur tabel: Search by name/employee number, filter by department/status, pagination.
  - Halaman Detail `/employees/[id]`:
    - Header Ringkasan: Foto avatar, nama, NIP, status kerja, departemen, dan tombol mutasi.
    - Tab detail:
      - **Profil Personal**: Data pribadi, alamat, kontak.
      - **Keluarga**: Sub-resource CRUD tabel keluarga.
      - **Pendidikan & Pengalaman**: Sub-resource CRUD riwayat pendidikan & pengalaman kerja.
      - **Riwayat Karir**: Log mutasi/promosi otomatis dari backend (`employee_histories`).

---

## Fase 6: Kehadiran & Cuti Dasar (M06 & M07)
### Step 6.1: Interactive Check-in & Leave Tracker
- **Modul:** Attendance & Leave UI
- **File:**
  - `apps/web/src/app/attendance-leave/page.tsx` [NEW]
  - `apps/web/src/features/attendance/components/...` [NEW]
  - `apps/web/src/features/leave/components/...` [NEW]
- **Detail:**
  - Landing page `/attendance-leave` dengan split layout:
    - **Sisi Kiri: Check-In/Check-Out Card**: Real-time clock digital, info shift hari ini (masuk/pulang), status kehadiran hari ini (Hadir, Terlambat, Belum Absen), dan tombol besar interactive untuk Check-In/Out.
    - **Sisi Kanan: Saldo Cuti & Pengajuan**: Progress ring sisa cuti tahunan (misal: "10 / 12 Hari Tersedia"), tombol "Ajukan Cuti", dan tabel status pengajuan cuti (Pending, Approved, Rejected).
  - Panel Review Manager (tampil jika user memiliki role `hr_manager` atau `supervisor`): Tabel persetujuan cuti karyawan dengan tombol tindakan `Approve` dan `Reject` yang instan dengan visual dynamic.

---

## Fase 7: Modul Dokumen & Laporan Basic (M12 & M17)
### Step 7.1: Document Vault & Report Panel
- **Modul:** Document & Report UI
- **File:**
  - `apps/web/src/app/documents-reports/page.tsx` [NEW]
  - `apps/web/src/features/document/components/...` [NEW]
  - `apps/web/src/features/report/components/...` [NEW]
- **Detail:**
  - Landing page `/documents-reports` membagi panel menjadi:
    - **Document Vault**: Daftar dokumen karyawan yang terunggah (KTP, NPWP, BPJS, dll.) dengan filter category. Tombol upload file dengan drag-and-drop area. Link nama file membuka signed URL di tab baru.
    - **Basic Reports**:
      - **Laporan Karyawan**: Filter status & departemen, pratinjau data di tabel, dan tombol "Ekspor CSV".
      - **Laporan Kehadiran**: Input range tanggal, pratinjau rekap kehadiran harian karyawan, dan tombol "Ekspor CSV".
      - **Laporan Cuti**: Input tahun laporan, pratinjau saldo & pemakaian cuti per orang, dan tombol "Ekspor CSV".

---

## Rencana Verifikasi Akhir
### Pengujian Integrasi API & UI
- Pastikan login berhasil di browser dengan Tenant ID dan kredensial valid, token tersimpan di storage.
- Pastikan intersep API mengirimkan tenant ID dan token dengan benar (pantau Network Tab).
- Verifikasi visual bahwa tidak ada sidebar yang terender di semua halaman modul, navigasi murni kembali ke launcher dashboard via header button.
- Lakukan check-in/out, pengajuan cuti, upload dokumen PDF, dan ekspor file laporan CSV untuk memverifikasi fungsionalitas ujung-ke-ujung (end-to-end).
