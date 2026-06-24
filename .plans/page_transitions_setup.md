# Rencana Implementasi: React Page Change Transition

## Ringkasan
Dokumen ini mendefinisikan rencana detail untuk menambahkan animasi transisi halaman (page transitions) di seluruh Next.js frontend menggunakan fitur native Next.js `template.tsx` dan CSS animations.

## Referensi Dokumen
- [Next.js App Router Templates](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#templates)
- [layout.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/layout.tsx)
- [globals.css](file:///d:/HBM/Project/HRIS/apps/web/src/app/globals.css)

## Kondisi Existing (Current State)
Saat ini, perpindahan antar halaman (misalnya dari Dashboard ke Employees) terjadi secara instan tanpa ada efek transisi memudar (fade) atau bergeser (slide). Hal ini membuat perpindahan terasa kaku.

## Target Akhir (Desired State)
Ketika pengguna berpindah halaman di dalam aplikasi, konten halaman baru akan muncul dengan transisi yang halus:
1. Memudar masuk (fade in) dari opacity `0` ke `1`.
2. Meluncur ke atas (slide up) secara halus dari `translateY(12px)` ke `translateY(0)` dengan scale `0.99` ke `1`.
3. Menggunakan kurva easing premium `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutExpo) dengan durasi `350ms` yang memberikan kesan ringan dan responsif.

---

## Rencana Implementasi

### Fase 1: Konfigurasi Animasi Global & Template Halaman

#### Step 1.1: Tambahkan Keyframe Animasi Baru
- **Modul**: Frontend (Next.js)
- **File**: `apps/web/src/app/globals.css` [MODIFY]
- **Aksi**: MODIFY
- **Detail**:
  - Daftarkan variabel kustom `--animate-page-enter` dan keyframes `page-enter`.
  - Gunakan visual properties `transform` (translateY, scale) dan `opacity` untuk menjamin hardware acceleration (performa 60 FPS).
- **Validasi**: Pastikan tidak ada error kompilasi CSS.

#### Step 1.2: Buat File Template Root
- **Modul**: Frontend (Next.js)
- **File**: `apps/web/src/app/template.tsx` [NEW]
- **Aksi**: NEW
- **Detail**:
  - Buat file `template.tsx` di tingkat root direktori `app/`.
  - Bungkus `children` dengan container `div` yang memiliki class `animate-page-enter flex-1 flex flex-col`.
- **Validasi**: Verifikasi file template terdeteksi oleh Next.js dev server.

---

## Checklist Verifikasi Akhir
- [ ] Lakukan navigasi antar modul halaman (misal: `/dashboard` -> `/organization` -> `/employees`).
- [ ] Verifikasi konten halaman baru memudar dan meluncur ke atas secara mulus.
- [ ] Jalankan `npm run web:build` untuk memastikan tidak ada kesalahan kompilasi.
