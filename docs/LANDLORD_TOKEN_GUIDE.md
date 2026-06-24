# 🔑 Panduan Akses Token Landlord (Central Console)

Dokumen ini menjelaskan cara menggunakan dan mengubah token akses keamanan untuk Landlord Console (pengelolaan data perusahaan/tenant).

---

## 🔒 Token Landlord Saat Ini

* **Default Token**: `nexus_central_secret`
* **Lokasi Penggunaan**: Diinput saat masuk ke halaman Landlord Console pada URL `/landlord` di web dashboard.
* **Header HTTP**: Dikirimkan melalui header `X-Central-Token` untuk mengotorisasi request API pengelolaan tenant (`index`, `store`, `update`, `destroy`).

---

## ⚙️ Cara Mengubah Token Landlord

Untuk mengubah token akses Landlord Console ke nilai kustom demi alasan keamanan, ikuti langkah-langkah berikut:

### Langkah 1: Tambahkan Konfigurasi pada File `.env` API
Buka file `.env` milik backend API pada path [apps/api/.env](file:///d:/HBM/Project/HRIS/apps/api/.env) dan tambahkan variabel `CENTRAL_API_KEY`:

```env
# Kunci Akses Landlord Console (Ubah nilai di bawah sesuai kebutuhan)
CENTRAL_API_KEY=kunci_rahasia_kustom_anda_disini
```

### Langkah 2: Bersihkan Cache Konfigurasi Laravel
Setelah mengubah file `.env`, Anda **WAJIB** membersihkan cache konfigurasi Laravel agar perubahan terbaca oleh sistem. Jalankan perintah berikut di root folder backend (`apps/api`):

```bash
php artisan optimize:clear
```
atau
```bash
php artisan config:clear
```

### Langkah 3: Gunakan Token Baru di UI
Sekarang, token lama (`nexus_central_secret`) tidak akan berlaku lagi. Anda harus memasukkan token baru (`kunci_rahasia_kustom_anda_disini`) saat masuk ke portal Landlord di web dashboard.
