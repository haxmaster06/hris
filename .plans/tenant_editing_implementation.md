# Rencana Implementasi: Edit Tenant pada Landlord Console

## Ringkasan
Dokumen ini mendefinisikan rencana detail untuk menambahkan fungsionalitas edit (pembaruan nama dan slug tenant) di Landlord Administrator Console. Fungsionalitas ini mencakup penambahan method API `update` pada backend (Laravel) dan implementasi tombol edit beserta dialog modal pada frontend (Next.js/React).

## Referensi Dokumen
- [TenantController.php](file:///d:/HBM/Project/HRIS/apps/api/app/Http/Controllers/Landlord/TenantController.php)
- [routes/api.php](file:///d:/HBM/Project/HRIS/apps/api/routes/api.php)
- [page.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/landlord/page.tsx)
- [TenantSetupApiTest.php](file:///d:/HBM/Project/HRIS/apps/api/tests/Feature/TenantSetupApiTest.php)

## Kondisi Existing (Current State)
Saat ini di Landlord Console (`/landlord`), admin platform hanya dapat:
1. Melihat list tenant (nama, slug, domain, tanggal dibuat).
2. Mendaftarkan tenant baru (membuat database schema dan mapping domain baru).
3. Menghapus tenant (drop database schema).
Tidak ada opsi untuk mengedit data tenant (nama/slug) setelah terdaftar.

## Target Akhir (Desired State)
1. **API Update Tenant**:
   - Controller `TenantController` mendukung aksi `update` (HTTP PUT/PATCH ke `/api/v1/tenants/{id}`).
   - Update memvalidasi perubahan nama dan keunikan slug.
   - Update memperbarui nama dan slug di tabel `tenants` serta nama domain terkait di tabel `domains`.
2. **UI Edit Tenant**:
   - Tersedia tombol edit (ikon pensil/edit) di baris setiap tenant pada tabel di halaman `/landlord`.
   - Menampilkan modal/dialog "Edit Tenant" dengan input nama dan slug terisi data tenant saat ini.
   - Menyimpan perubahan melalui HTTP PUT ke API.
3. **Unit Tests**:
   - Menambahkan test case untuk update tenant di unit/feature test backend.

---

## Rencana Perubahan (Fase Implementasi)

### Fase 1: Backend API Development

#### Step 1.1: Penambahan Method Update pada TenantController
- **Modul:** Landlord
- **File:** [TenantController.php](file:///d:/HBM/Project/HRIS/apps/api/app/Http/Controllers/Landlord/TenantController.php)
- **Aksi:** MODIFY
- **Detail:**
  - Tambahkan method `update(Request $request, string $id)` ke dalam controller.
  - Cari tenant berdasarkan `$id`. Kembalikan 404 jika tidak ditemukan.
  - Lakukan validasi `name` (required, string) dan `slug` (required, unique except current tenant ID).
  - Update `name` dan `slug` di model `Tenant`.
  - Cari domain terkait di model `Domain` lalu update domain tersebut menjadi `{$slug}.local`.
  - Kembalikan response JSON berisi data tenant yang diperbarui.
- **Validasi:** Jalankan PHPUnit test setelah diimplementasikan.

#### Step 1.2: Pendaftaran Route Update
- **Modul:** Landlord
- **File:** [routes/api.php](file:///d:/HBM/Project/HRIS/apps/api/routes/api.php)
- **Aksi:** MODIFY
- **Detail:**
  - Tambahkan `update` ke dalam resource routes: `Route::apiResource('tenants', TenantController::class)->only(['index', 'store', 'update', 'destroy'])`.
- **Validasi:** Route `PUT /api/v1/tenants/{id}` terdaftar (bisa dicek dengan `php artisan route:list`).

#### Step 1.3: Update Feature Test
- **Modul:** Landlord / Test
- **File:** [TenantSetupApiTest.php](file:///d:/HBM/Project/HRIS/apps/api/tests/Feature/TenantSetupApiTest.php)
- **Aksi:** MODIFY
- **Detail:**
  - Tambahkan langkah pengujian update pada `test_can_manage_tenants_via_api()`.
  - Kirim request PUT ke `/api/v1/tenants/{id}` dengan nama dan slug baru.
  - Assert response 200, status `success => true`, dan data baru.
  - Assert record di database telah berubah (`assertDatabaseHas('tenants', ...)`).
- **Validasi:** Jalankan `php artisan test --filter=TenantSetupApiTest` dan pastikan semua test hijau/passing.

---

### Fase 2: Frontend Integration

#### Step 2.1: UI Edit Modal dan Tombol Aksi di Landlord Page
- **Modul:** Frontend
- **File:** [page.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/landlord/page.tsx)
- **Aksi:** MODIFY
- **Detail:**
  - Tambahkan state untuk modal edit: `showEditModal` (boolean), `editingTenant` (Tenant | null), `editTenantName` (string), `editTenantSlug` (string).
  - Tambahkan tombol Edit (ikon `Edit` dari `lucide-react`) di samping tombol hapus di setiap baris tabel.
  - Ketika tombol Edit diklik, set `editingTenant` dan isikan state input name & slug, lalu buka modal edit.
  - Implementasikan method `handleUpdateTenant(e: React.FormEvent)` untuk melakukan call `PUT http://localhost:7030/api/v1/tenants/{id}` dengan headers `X-Central-Token`.
  - Update list `tenants` lokal setelah update berhasil dan tutup modal.
- **Validasi:** Cek tampilan visual tombol dan dialog modal edit. Pastikan transisi smooth dan menggunakan style tailwind gelap-futuristik yang serasi dengan UI existing.

---

## Checklist Verifikasi Akhir
- [ ] Jalankan `php artisan test` di backend, pastikan test suite hijau.
- [ ] Jalankan `npm run web:build` di frontend, pastikan build Next.js sukses tanpa error typecheck.
- [ ] Uji edit tenant via UI:
  - Buka `/landlord`, unlock console.
  - Klik tombol edit pada salah satu tenant.
  - Ubah nama dan slug, lalu simpan.
  - Pastikan data terupdate di tabel dan perubahan tersimpan di database.
