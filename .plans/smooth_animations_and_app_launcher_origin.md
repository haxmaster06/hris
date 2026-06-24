# Perbaikan Animasi dan Pergerakan App Launcher

## Ringkasan
Dokumen ini mendefinisikan rencana detail implementasi teknis untuk menambahkan pergerakan animasi yang halus (smooth transitions & animations) pada seluruh komponen/objek aplikasi Next.js frontend, dengan fokus utama pada **App Launcher Pop-up (Waffle Menu)** agar muncul seakan-akan dari arah tombol pemicunya (waffle button).

## Referensi Dokumen
- [AppLauncherOverlay.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/components/AppLauncherOverlay.tsx)
- [Header.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/components/Header.tsx)
- [globals.css](file:///d:/HBM/Project/HRIS/apps/web/src/app/globals.css)

## Kondisi Existing (Current State)
1. **App Launcher Pop-up**: Animasi `launcher-emerge` saat ini memiliki pergeseran statis menggunakan translation (`scale(0.05) translate(-35vw, -15vh)`). Hal ini menyebabkan efek kemunculan pop-up tidak tepat sasaran atau tidak pas dengan posisi waffle button yang sesungguhnya di berbagai ukuran layar. Selain itu, transisi penutupan pop-up terputus (instant unmount) tanpa animasi balik.
2. **Animasi & Transisi Objek**: Transisi hover pada dashboard cards, input elements, dan buttons masih terasa standar dan kurang memiliki visual premium (misalnya transition duration pendek dan easing standar).

## Target Akhir (Desired State)
1. **App Launcher Pop-up (Emerge dari Trigger)**:
   - Saat waffle button diklik (atau diakses via shortcut `Ctrl + K` / `Cmd + K`), modal mengukur koordinat absolut dari tombol tersebut di viewport.
   - Mengubah `transform-origin` dari modal container secara dinamis agar sesuai dengan posisi tombol relatif terhadap modal.
   - Modal membesar (scale up dari `0.05` ke `1`) dan memudar (opacity & blur) keluar secara elastis dari posisi tersebut menggunakan cubic-bezier transition yang premium (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
   - Saat ditutup, modal mengempis (scale down ke `0.05` & fade out) kembali tepat ke waffle button sebelum benar-benar di-unmount dari DOM.
2. **Animasi Global yang Halus**:
   - Menambahkan transisi micro-interaction yang halus pada dashboard cards, buttons, dan input fields menggunakan timing function `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutExpo) dengan durasi `300ms` agar terlihat modern dan responsif.

---

## Fase 1: App Launcher Emerge Animation

### Step 1.1: Modifikasi App Launcher Component
- **Modul**: Frontend (Next.js)
- **File**: `apps/web/src/components/AppLauncherOverlay.tsx`
- **Aksi**: MODIFY
- **Detail**:
  - Ganti render kondisional `if (!isOpen) return null;` dengan mengontrol render lewat state internal `shouldRender` dan transisi `active` agar modal bisa keluar masuk dengan transisi lengkap.
  - Tambahkan `useRef` pada modal container untuk mendapatkan ukuran dan posisinya di viewport.
  - Implementasikan `useEffect` untuk mendeteksi `isOpen`. Saat true, hitung posisi tombol waffle (`[title*="App Launcher"]`) secara presisi relatif terhadap modal container, lalu set state `origin`.
  - Pasang inline style `transformOrigin` dengan koordinat dinamis tersebut.
  - Gunakan class transitions (`transition-all duration-350 cubic-bezier(0.34, 1.56, 0.64, 1)`) dengan state `active` (scale-100/opacity-100/blur-none vs scale-5/opacity-0/blur-md).
- **Validasi**: Verifikasi modal tidak langsung hilang seketika saat ditutup melainkan mengecil kembali ke arah tombol.

### Step 1.2: Pembersihan Globals CSS
- **Modul**: Frontend (Next.js)
- **File**: `apps/web/src/app/globals.css`
- **Aksi**: MODIFY
- **Detail**:
  - Hapus keyframes `launcher-emerge` yang statis karena kita telah bermigrasi ke dynamic transform-origin + transition-all.
- **Validasi**: Jalankan `npm run build` dan pastikan tidak ada CSS compile error.

---

## Fase 2: Peningkatan Animasi Global

### Step 2.1: Modifikasi Globals CSS untuk Transisi Input & Hover
- **Modul**: Frontend (Next.js)
- **File**: `apps/web/src/app/globals.css`
- **Aksi**: MODIFY
- **Detail**:
  - Perbarui transisi input focus agar menggunakan transition-all `300ms` dengan easing `cubic-bezier(0.16, 1, 0.3, 1)` untuk efek transisi border dan ring-glow yang super smooth.
  - Tambahkan global helper transition/hover di custom theme jika diperlukan.
- **Validasi**: Fokus pada form input di halaman login/admin dan rasakan transisi ring fokus yang smooth.

### Step 2.2: Haluskan Efek Hover Dashboard & Button
- **Modul**: Frontend (Next.js)
- **File**:
  - `apps/web/src/app/dashboard/page.tsx`
  - `apps/web/src/components/ui/button.tsx`
- **Aksi**: MODIFY
- **Detail**:
  - Perbaiki transisi hover card dashboard agar menggunakan durasi `300ms` dengan curve `cubic-bezier(0.16, 1, 0.3, 1)`.
  - Gunakan transisi scale yang sedikit lebih halus (`hover:scale-[1.015]` atau `hover:-translate-y-0.5`).
- **Validasi**: Arahkan mouse ke card dashboard, pastikan efek hover terasa responsif tapi smooth.

---

## Checklist Verifikasi Akhir
- [ ] Buka dashboard utama, arahkan pointer ke modul cards. Pastikan hover shadow dan scale-up bertransisi dengan smooth.
- [ ] Klik waffle icon (App Launcher) di header. Pastikan modal pop-up membesar tepat dari arah tombol waffle tersebut.
- [ ] Tutup App Launcher dengan mengklik area luar atau menekan Esc/tombol X. Pastikan modal mengecil kembali ke arah waffle button dan memudar halus.
- [ ] Buka App Launcher via keyboard shortcut `Ctrl + K`. Pastikan arah kemunculan tetap memancar dari waffle button.
- [ ] Jalankan build production (`npm run build`) untuk memvalidasi tidak ada compilation error pada build pipeline.
