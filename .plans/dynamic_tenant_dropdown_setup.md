# Rencana Implementasi: Tenant Dropdown Dinamis dari Database Landlord

## Ringkasan
Dokumen ini mendefinisikan rencana detail untuk memuat daftar tenant secara dinamis dari database landlord ke dalam Select component pada halaman Login Next.js frontend, menggantikan data hardcoded.

## Referensi Dokumen
- [TenantController.php](file:///d:/HBM/Project/HRIS/apps/api/app/Http/Controllers/Landlord/TenantController.php)
- [routes/api.php](file:///d:/HBM/Project/HRIS/apps/api/routes/api.php)
- [login-form.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/login/login-form.tsx)

## Kondisi Existing (Current State)
Pilihan tenant di form login masih ditulis secara manual (hardcoded `"haxmaster"` dan `"haxmaster2"`). Pengguna tidak dapat melihat tenant dinamis lainnya yang terdaftar di central database.

## Target Akhir (Desired State)
1. **API Endpoint Publik**:
   - Menambahkan endpoint `GET /api/v1/tenants/list` di routes central yang mengembalikan nama dan slug seluruh tenant terdaftar.
   - Endpoint ini dibebaskan dari validasi `X-Central-Token` agar dapat dipanggil secara publik oleh halaman login.
2. **Frontend Dynamic Fetching**:
   - Halaman login melakukan call API ke `/api/v1/tenants/list` saat komponen dimount.
   - Mengisi opsi-opsi `<MenuItem>` di dalam `<Select>` secara dinamis dengan nama dan slug hasil fetch dari database.
   - Menampilkan loading state jika data sedang dimuat.

---

## Rencana Implementasi

### Fase 1: Backend API Development

#### Step 1.1: Pembuatan Endpoint Publik Landlord
- **Modul**: Core (Landlord Domain)
- **File**: `apps/api/app/Http/Controllers/Landlord/TenantController.php` [MODIFY]
- **Aksi**: MODIFY
- **Detail**:
  - Kecualikan metode `publicList` dari middleware validasi token: `(new Middleware(...))->except(['publicList'])`.
  - Buat metode `publicList()` yang mengambil seluruh data dari model `Tenant::all(['id', 'name', 'slug'])` dan mengembalikannya sebagai JSON success response.
- **Validasi**: Panggil `GET http://localhost/api/v1/tenants/list` tanpa header token, pastikan mengembalikan list tenant (Haxmaster Company & CV Hasil Barokah Mandiri).

#### Step 1.2: Pendaftaran Route Baru
- **Modul**: Core (Landlord Domain)
- **File**: `apps/api/routes/api.php` [MODIFY]
- **Aksi**: MODIFY
- **Detail**:
  - Daftarkan route: `Route::get('/tenants/list', [TenantController::class, 'publicList']);` sebelum deklarasi resource tenants.
- **Validasi**: Uji kelancaran akses route via web browser/postman.

---

### Fase 2: Frontend Integration

#### Step 2.1: Implementasi Dynamic Fetching di Form Login
- **Modul**: Frontend (Next.js)
- **File**: `apps/web/src/app/login/login-form.tsx` [MODIFY]
- **Aksi**: MODIFY
- **Detail**:
  - Tambahkan `useEffect` dan state `tenants` (array berisi `{ name, slug }`) serta `isTenantsLoading` (boolean).
  - Panggil endpoint `/api/v1/tenants/list` (menggunakan client `api` / axios) saat mount.
  - Render opsi-opsi menu dropdown dengan memetakan state `tenants`.
- **Validasi**: Verifikasi dropdown login kini otomatis terisi data tenant riil dari database.

---

## Checklist Verifikasi Akhir
- [ ] Buka `/login` di browser, periksa dropdown tenant. Pastikan memunculkan opsi "Haxmaster Company" dan "CV Hasil Barokah Mandiri" yang berasal dari database PostgreSQL.
- [ ] Jalankan `npm run web:build` untuk memastikan build produksi Next.js terkompilasi dengan sempurna.
