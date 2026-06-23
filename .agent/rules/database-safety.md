---
trigger: always_on
---

# Database Safety Rule

Rule ini WAJIB dipatuhi sebelum melakukan aksi apa pun yang berhubungan dengan STRUKTUR (migration) maupun DATA (seeding, bulk update, hard delete) di database.

## PRINSIP UTAMA
- **Data Integrity First**: Keamanan data lebih penting daripada kecepatan eksekusi.
- **Always Have a Way Back**: Pastikan ada snapshot yang bisa direstore jika terjadi kegagalan.

## PROSEDUR WAJIB (Sebelum Modifikasi Database)

### 1. Lakukan Backup Sederhana
Sebelum menjalankan `migrate`, `db:seed`, atau query SQL `UPDATE`/`DELETE` yang masif, lakukan backup tabel/database yang relevan.

**Metode yang disarankan (Local Dev):**
- Gunakan `mysqldump` jika tersedia:
  ```bash
  mysqldump -u root erp_hbm_db > database_backup_YYYYMMDD_HHMMSS.sql
  ```
- Jika `mysqldump` tidak tersedia, lakukan ekspor CSV atau salinan tabel via tool GUI/Tinker jika memungkinkan.
- **Minimal**: Informasikan ke USER untuk melakukan backup manual jika agent tidak memiliki akses ke tool pengerjaan dump.

### 2. Validasi Lingkungan (Environment)
- Selalu pastikan `DB_DATABASE` pada file `.env` sesuai dengan target yang dimaksud.
- Hindari menjalankan perintah `test` pada database utama. Pastikan `.env.testing` atau `phpunit.xml` menggunakan database terpisah (misal: `erp_hbm_db_testing`).

### 3. Gunakan Transaksi (Jika Memungkinkan)
Untuk manipulasi data via Tinker atau Controller, gunakan `DB::beginTransaction()` dan `DB::commit()` setelah verifikasi berhasil.

## JIKA TERJADI KERUSAKAN DATA
1. **Hentikan Segera**: Jangan jalankan perintah tambahan yang bisa memperparah kondisi.
2. **Informasikan User**: Segera sampaikan apa yang terjadi dan tunjukkan log kesalahannya.
3. **Restorasi**: Gunakan file backup yang dibuat di langkah (1) untuk mengembalikan kondisi database.

## PENGECEKAN RUTIN
- Pastikan Seeders bersifat **Idempotent** (menggunakan `updateOrCreate` atau `firstOrCreate`) agar tidak menghasilkan "Duplicate Entry" saat dijalankan berulang kali.
