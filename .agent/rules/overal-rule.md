---
trigger: always_on
---

rule ini berlaku untuk semua Modul, fitur, action, view, flow di dalam project ini baik laravel maupun Flutter(Mobile)

- pastikan user dimudahkan, tidak sibuk input yang tidak perlu
- apabila memungkinkan di otomatiskan maka lakukan
- pada tabel / list pastikan anda menambahkan filter minimal yang berguna
- hitung jumlah kolom bila terlalu banyak maka sembunyikan beberapa, anda bisa menanyakan ke user bila butuh konfirmasi
- **Arsitektur Multi-Tenant Schema-per-Tenant (WAJIB)**: Selalu ingat dan verifikasi bahwa project ini menggunakan arsitektur **PostgreSQL Schema-per-Tenant** (satu schema database PostgreSQL terpisah untuk masing-masing tenant/perusahaan) dikelola oleh package `stancl/tenancy`.
  - Pemisahan data dilakukan di level database schema, sehingga kolom `company_id` atau `tenant_id` TIDAK diperlukan di tabel-tabel tenant.
  - Dilarang berasumsi semua tenant berbagi schema tabel yang sama di runtime. Koneksi database dipindah secara otomatis oleh middleware `stancl/tenancy` ke schema tenant yang aktif.
- DILARANG menyalakan / memulai development server atau server aplikasi secara otomatis di background (seperti `php artisan octane:start`, `npm run dev`, dll.) tanpa perintah eksplisit dari USER.

