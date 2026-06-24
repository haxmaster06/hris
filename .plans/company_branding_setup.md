# Rencana Implementasi: Rebranding Company & Setup Logo Perusahaan

## Ringkasan
Dokumen ini mendefinisikan rencana detail untuk mengubah istilah "Tenant" menjadi "Company" di seluruh area user-facing, mengimplementasikan pengunggahan logo perusahaan pada saat pendaftaran/edit company, serta mengaitkan data perusahaan (Logo dan Nama) ke user session untuk personalisasi visual saat login dan di dalam dashboard.

## Referensi Dokumen
- [TenantController.php](file:///d:/HBM/Project/HRIS/apps/api/app/Http/Controllers/Landlord/TenantController.php)
- [TenantSettingsController.php](file:///d:/HBM/Project/HRIS/apps/api/app/Http/Controllers/Tenant/TenantSettingsController.php)
- [login-form.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/login/login-form.tsx)
- [page.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/landlord/page.tsx)
- [Header.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/components/Header.tsx)
- [authStore.ts](file:///d:/HBM/Project/HRIS/apps/web/src/stores/authStore.ts)

## Kondisi Existing (Current State)
1. Sistem menggunakan istilah "Tenant" secara luas di UI (contoh: "Tenant Schemas Setup", "Select Tenant").
2. Tidak ada field atau mekanisme pengunggahan logo untuk organisasi/company.
3. Header aplikasi hanya menampilkan tulisan statis atau default "N" dan ID tenant, tanpa menampilkan nama perusahaan atau logo khusus perusahaan.

## Target Akhir (Desired State)
1. **Rebranding**:
   - Seluruh teks label, dialog modal, dan visual UI yang menggunakan kata "Tenant" diubah menjadi "Company".
2. **Company Logo**:
   - Platform mendukung logo per company (file gambar PNG/JPG/SVG).
   - Backend menyimpan logo di public storage (`/storage/logos/{company_id}.png`) dan menyimpan URL logo (`logo_url`) di atribut JSON `data` model Tenant/Company.
3. **Binding & Visual Personalization**:
   - Saat Login: Ketika pengguna memilih Company di Select dropdown, form login akan menampilkan Logo dan Nama Company terpilih di atas card login secara dinamis.
   - Di Dalam Dashboard (Header): Logo dan nama Company aktif akan ditampilkan di Header navigasi atas.

---

## Rencana Perubahan (Fase Implementasi)

### Fase 1: Backend Setup Logo & API Rebranding

#### Step 1.1: Dukungan Pengunggahan Logo di TenantController
- **Modul:** Landlord
- **File:** [TenantController.php](file:///d:/HBM/Project/HRIS/apps/api/app/Http/Controllers/Landlord/TenantController.php)
- **Aksi:** MODIFY
- **Detail:**
  - Tambahkan validasi `'logo' => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048'` pada method `store` dan `update`.
  - Jika file logo diunggah, simpan file ke disk `public` di subdirektori `logos` dengan format nama berkas `logos/{$tenantId}.{$extension}`.
  - Simpan URL logo ke model tenant: `$tenant->logo_url = Storage::disk('public')->url($path);`.
  - Kembalikan `logo_url` di response data.
  - Pada method `index` dan `publicList`, sertakan `logo_url` dalam response JSON data tenant/company.

#### Step 1.2: Sertakan logo_url pada TenantSettingsController
- **Modul:** Tenant
- **File:** [TenantSettingsController.php](file:///d:/HBM/Project/HRIS/apps/api/app/Http/Controllers/Tenant/TenantSettingsController.php)
- **Aksi:** MODIFY
- **Detail:**
  - Kembalikan `logo_url` (diambil dari `$tenant->logo_url`) pada response method `show` dan `update`.

---

### Fase 2: Frontend Rebranding & UI Integration

#### Step 2.1: Update authStore untuk Menyimpan Data Company
- **Modul:** Frontend (Zustand Store)
- **File:** [authStore.ts](file:///d:/HBM/Project/HRIS/apps/web/src/stores/authStore.ts)
- **Aksi:** MODIFY
- **Detail:**
  - Tambahkan state `companyName` (string | null) dan `companyLogoUrl` (string | null).
  - Tambahkan action `setCompanyDetails(name: string | null, logoUrl: string | null)`.
  - Pastikan `companyName` dan `companyLogoUrl` disertakan dalam partialize persist dan dibersihkan saat `clearAuth`.

#### Step 2.2: Rebranding & Tampilan Dinamis di Login Form
- **Modul:** Frontend
- **File:** [login-form.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/login/login-form.tsx)
- **Aksi:** MODIFY
- **Detail:**
  - Ubah UI label dari "Tenant" ke "Company".
  - Tambahkan tracking state `selectedCompany` (objek CompanyOption dengan fields `name`, `slug`, `logo_url`).
  - Ketika dropdown Company dipilih, perbarui state `selectedCompany`.
  - Tampilkan nama dan logo Company secara elegan di atas form login jika dipilih.
  - Simpan details nama dan logo ke `authStore` saat login sukses.

#### Step 2.3: Rebranding Landlord Console & Upload Logo UI
- **Modul:** Frontend
- **File:** [page.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/landlord/page.tsx)
- **Aksi:** MODIFY
- **Detail:**
  - Ubah seluruh visual dan string teks dari "Tenant" ke "Company" (misal: "Company List", "Register Company").
  - Tambahkan input file logo pada modal pendaftaran dan modal edit company.
  - Kirim data form menggunakan `FormData` agar mendukung file upload ke API backend.

#### Step 2.4: Integrasi Logo di Header Navigasi
- **Modul:** Frontend
- **File:** [Header.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/components/Header.tsx)
- **Aksi:** MODIFY
- **Detail:**
  - Ambil `companyName` dan `companyLogoUrl` dari `useAuthStore`.
  - Tampilkan logo company di bagian kiri header navigasi (di samping tombol waffle) menggantikan logo default "N".
  - Ubah teks "Tenant: {tenantId}" di bawah profil user menjadi "Company: {companyName}".

---

## Checklist Verifikasi Akhir
- [ ] Jalankan `npm run web:build` untuk memastikan Next.js terkompilasi bersih.
- [ ] Buka Landlord Console (`/landlord`), daftar Company baru beserta unggahan file logo.
- [ ] Edit Company tersebut dan perbarui logonya, verifikasi logo berubah.
- [ ] Buka halaman Login `/login`, pilih Company dari select dropdown, pastikan Logo dan Nama Company muncul dinamis.
- [ ] Login sukses dan verifikasi Logo serta Nama Company aktif tampil di Header navigasi dashboard.
