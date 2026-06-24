# Rencana Implementasi: Standarisasi UI (MUI) & Error/Notif Handler (Sweet Alert)

## Ringkasan
Dokumen ini mendefinisikan rencana detail untuk menerapkan standarisasi UI menggunakan **Material UI (MUI)** dan standarisasi penanganan pesan error/notifikasi menggunakan **SweetAlert2** pada Next.js frontend.

## Referensi Dokumen
- [package.json](file:///d:/HBM/Project/HRIS/apps/web/package.json)
- [providers.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/components/providers.tsx)
- [login-form.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/login/login-form.tsx)

## Kondisi Existing (Current State)
1. **Toast Notification**: Aplikasi saat ini menggunakan library `sonner` untuk memicu notifikasi toast (`toast.success`, `toast.error`, dll). Sonner membutuhkan `<Toaster />` yang dirender di root layout.
2. **Library UI**: Aplikasi saat ini menggunakan Tailwind CSS v4, vanilla CSS, dan shadcn button (`@base-ui/react`). Belum ada integrasi Material UI (MUI).

## Target Akhir (Desired State)
1. **SweetAlert2 Notification**:
   - Ganti library `sonner` sepenuhnya dengan **SweetAlert2**.
   - Buat helper utility `apps/web/src/lib/toast.ts` yang membungkus SweetAlert2 (menggunakan `Swal.mixin` untuk toast) dan memiliki API signature yang sama (`toast.success`, `toast.error`, dll).
   - Ganti seluruh import `sonner` di 29 file di bawah `apps/web/src` ke file helper `toast.ts`.
   - Hapus library `sonner` dan komponen `<Toaster />` dari `providers.tsx`.
2. **Material UI (MUI) Integration**:
   - Pasang library `@mui/material`, `@emotion/react`, dan `@emotion/styled`.
   - Daftarkan `ThemeProvider` dan `CssBaseline` MUI di dalam `providers.tsx` untuk menyelaraskan skema warna primary (#2563EB) dan background dengan dark mode/light mode.
   - Refactor halaman Login Form (`login-form.tsx`) menggunakan komponen-komponen MUI (`Box`, `TextField`, `Button`, `Typography`, dll) sebagai standardisasi awal UI.

---

## Rencana Implementasi

### Fase 1: Instalasi & Konfigurasi Library

#### Step 1.1: Instalasi Dependency Baru
- **Modul**: Frontend (Next.js)
- **Aksi**: RUN COMMAND
- **Detail**:
  - Jalankan `npm install @mui/material @emotion/react @emotion/styled sweetalert2 --legacy-peer-deps -w apps/web` di root workspace.
- **Validasi**: Verifikasi package berhasil masuk ke dalam dependencies `apps/web/package.json`.

#### Step 1.2: Pembuatan SweetAlert2 Toast Helper
- **Modul**: Frontend (Next.js)
- **File**: `apps/web/src/lib/toast.ts` [NEW]
- **Aksi**: NEW
- **Detail**:
  - Buat helper `toast` menggunakan `Swal.mixin({ toast: true, position: 'top-end', timer: 3000, timerProgressBar: true, showConfirmButton: false })`.
  - Dukung fungsi: `success`, `error`, `info`, `warning`.
  - Atur warna background dan teks dynamically menggunakan CSS Variables (`var(--background)`, `var(--foreground)`).
- **Validasi**: Verifikasi file typescript dicompile tanpa error.

#### Step 1.3: Registrasi MUI Theme Provider
- **Modul**: Frontend (Next.js)
- **File**: `apps/web/src/components/providers.tsx` [MODIFY]
- **Aksi**: MODIFY
- **Detail**:
  - Buat instance tema MUI menggunakan `createTheme` yang selaras dengan variable warna OKLCH/Tailwind (misal: primary `#2563eb`).
  - Bungkus `children` dengan `<ThemeProvider theme={theme}>` dan hilangkan komponen `<Toaster />` sonner.
- **Validasi**: Buka halaman, pastikan layout termounting dengan benar dan tidak ada styling global yang rusak.

---

### Fase 2: Refactoring Notifikasi & UI Form

#### Step 2.1: Refactor Import Sonner di Codebase
- **Modul**: Frontend (Next.js)
- **File**: 29 files di `apps/web/src` yang menggunakan `"sonner"`
- **Aksi**: MODIFY
- **Detail**:
  - Ganti statement `import { toast } from "sonner";` menjadi `import { toast } from "@/lib/toast";`.
- **Validasi**: Pastikan seluruh notifikasi di dalam aplikasi (success onboard, error, dll) sekarang memicu popup SweetAlert2 di pojok kanan atas.

#### Step 2.2: Refactor Login Form menggunakan Material UI (MUI)
- **Modul**: Frontend (Next.js)
- **File**: `apps/web/src/app/login/login-form.tsx` [MODIFY]
- **Aksi**: MODIFY
- **Detail**:
  - Desain ulang formulir login menggunakan komponen MUI:
    - `<TextField>` dengan input icons (Mail, Lock, Building) memakai `InputAdornment`.
    - `<Button>` MUI dengan variant `contained` dan warna primary.
    - `<Box>` dan `<Typography>` MUI untuk layouting dan label text.
  - Tetap hubungkan dengan React Hook Form (`register` dan `formState.errors`).
- **Validasi**: Tampilan login form berubah menjadi modern ala Material Design dengan responsivitas tinggi.

---

## Checklist Verifikasi Akhir
- [ ] Buka halaman login (`/login`), isi data sembarang untuk memicu error login, dan pastikan error message SweetAlert2 Toast muncul di pojok kanan atas.
- [ ] Cek form input login baru, pastikan didesain penuh menggunakan komponen TextField Material UI dan berfungsi 100%.
- [ ] Jalankan `npm run web:build` untuk memastikan build produksi Next.js terkompilasi dengan sempurna.
