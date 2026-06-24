# Planning: Raycast-Style Dashboard Command Center

## Ringkasan
Merombak halaman Dashboard Launcher (`/dashboard`) dari model grid card konvensional menjadi antarmuka **Command Center (Raycast-Style)** yang responsif, berkecepatan tinggi, dan mendukung navigasi keyboard penuh. Perubahan ini akan memudahkan pengguna dalam mencari, memfilter, dan menavigasi ke modul-modul HRIS tanpa harus menyentuh mouse.

## Referensi Dokumen
- Pola interaksi keyboard & search: Raycast / Spotlight Search UI patterns.
- Standar UI/UX internal: [RULE[overal-rule.md]](file:///d:/HBM/Project/HRIS) & [RULE[user_global]](file:///d:/HBM/Project/HRIS).

## Kondisi Existing (Current State)
- Halaman `/dashboard` menampilkan Grid Card grid-cols-3 dengan kartu modul statis.
- Desain menggunakan border glow dan tombol hover.
- Belum ada fitur pencarian modul secara real-time.
- Navigasi sepenuhnya mengandalkan klik mouse (belum ada dukung keyboard shortcuts).

## Target Akhir (Desired State)
- Halaman `/dashboard` menampilkan sebuah **Command Center Window** terpusat (lebar `max-w-3xl`) dengan nuansa glassmorphism premium.
- **Search Bar (Spotlight)** di bagian atas dengan shortcut indicator `/` untuk fokus cepat.
- **Interactive List Item (Bukan Card Besar)** yang terorganisir per kelompok kategori dengan tag visual yang rapi.
- **Navigasi Keyboard Penuh**:
  - `↑` (ArrowUp) dan `↓` (ArrowDown) untuk memilih item dari daftar hasil filter.
  - `↵ Enter` untuk membuka modul yang sedang terpilih.
  - `⌥ + [1-9]` (Alt + Angka) sebagai tombol cepat (quick action) untuk menavigasi ke modul spesifik secara instan.
  - `/` untuk memfokuskan kembali input pencarian.
- **Footer Navigation**: Petunjuk pintasan keyboard (cheat sheet) yang elegan di bagian bawah panel command center.
- Menjaga keandalan fungsionalitas multi-tenant dan batasan hak akses (Admin vs Employee).

---

## Fase 1: Perubahan Frontend (Web)

### Step 1.1: Pembuatan Struktur Halaman Baru di Dashboard
- **Modul:** Frontend Dashboard
- **File:** [page.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/dashboard/page.tsx)
- **Aksi:** MODIFY
- **Detail:**
  - Definisikan ulang data array `modules` untuk menambahkan informasi `category` (misalnya: "Core HR", "Workforce", "Talent", "Security").
  - Gunakan React state `searchQuery` untuk melacak teks pencarian.
  - Gunakan React state `selectedIndex` untuk menandai index baris yang sedang dipilih via keyboard.
  - Gunakan `useRef` untuk memfokuskan input text pencarian secara otomatis saat halaman dimuat.
  - Implementasikan fungsi filter berbasis nama modul, deskripsi, maupun kategori.

### Step 1.2: Implementasi Event Listener Keyboard
- **Modul:** Frontend Dashboard
- **File:** [page.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/dashboard/page.tsx)
- **Aksi:** MODIFY
- **Detail:**
  - Tambahkan `useEffect` yang meregistrasikan event listener `keydown` secara global pada level window:
    - **ArrowDown (`ArrowDown`)**: Meningkatkan `selectedIndex` (jika mencapai batas akhir, reset ke `0`). Cegah scroll default halaman.
    - **ArrowUp (`ArrowUp`)**: Mengurangi `selectedIndex` (jika mencapai batas atas, reset ke indeks akhir). Cegah scroll default halaman.
    - **Enter (`Enter`)**: Membuka tautan (menggunakan `router.push()`) dari modul yang terpilih pada indeks aktif.
    - **Slash (`/`)**: Memfokuskan input pencarian jika elemen input pencarian sedang tidak terfokus. Cegah input karakter `/` masuk ke dalam input text dengan menggunakan `e.preventDefault()`.
    - **Alt + [1-9]**: Langsung memicu navigasi ke modul bersangkutan (misal: Alt+1 memicu navigasi ke modul pertama yang terlihat).
  - Pastikan listener dibersihkan (`removeEventListener`) saat component unmount.

### Step 1.3: Redesain UI Command Center (Raycast/Spotlight Style)
- **Modul:** Frontend Dashboard
- **File:** [page.tsx](file:///d:/HBM/Project/HRIS/apps/web/src/app/dashboard/page.tsx)
- **Aksi:** MODIFY
- **Detail:**
  - Ganti wrapper grid lama dengan container panel tengah:
    - Layout: `flex flex-col justify-center items-center py-12 px-4`
    - Panel Box: `w-full max-w-3xl bg-white/70 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-900 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden`
  - **Search Header**:
    - Input pencarian tanpa border (`bg-transparent focus:ring-0 outline-none w-full py-4 px-6 text-sm`) dengan icon `Search` di kiri.
    - Badge shortcut di kanan: `Alt + /` atau `/`.
  - **Daftar Per Kategori**:
    - Kelompokkan hasil pencarian berdasarkan `category`.
    - Render nama kategori menggunakan label teks kecil uppercase (`text-[10px] font-bold text-zinc-400 dark:text-zinc-500 py-1 px-6 bg-zinc-50/50 dark:bg-zinc-900/30 border-y border-zinc-150/40 dark:border-zinc-900/40`).
  - **Row Item**:
    - Tampilkan baris tipis berukuran `py-3 px-6 flex items-center justify-between transition-all duration-150 cursor-pointer`.
    - Tambahkan visual state terpilih: `bg-zinc-100/80 dark:bg-zinc-900/85 text-zinc-900 dark:text-zinc-100` bila `selectedIndex` sama dengan indeks item, atau saat di-hover mouse.
    - Sisi kiri: Icon modul kecil berlatar warna gradasi, judul tebal, deskripsi singkat di sampingnya dengan warna teks sekunder.
    - Sisi kanan: Badge kategori dan shortcut badge instan (misal: `⌥ 1`, `⌥ 2`, dll.) atau badge tombol `↵ Enter` bila terpilih.
  - **Footer Panel**:
    - Area status di bawah list yang menyajikan cheat sheet navigasi keyboard: `↑↓ to navigate • ↵ to open • / to search • ⌥ + Number for quick jump`.

---

## Verification Plan

### Automated Tests
- Jalankan kompilasi produksi frontend:
  ```bash
  npm run web:build
  ```
  Pastikan tidak ada error TypeScript maupun kegagalan rendering statis Next.js.

### Manual Verification
1. **Pencarian Real-Time**:
   - Ketik kata kunci (misalnya "att" atau "employ") di kolom pencarian.
   - Verifikasi daftar modul langsung tersaring secara dinamis.
   - Verifikasi highlight pilihan berpindah ke item pertama yang cocok.
2. **Navigasi Keyboard**:
   - Tekan tombol `↓` beberapa kali dan pastikan highlight visual berpindah ke bawah dengan mulus.
   - Tekan tombol `↑` beberapa kali dan pastikan highlight berpindah ke atas.
   - Tekan `Enter` saat modul tertentu terhighlight dan verifikasi Anda dialihkan ke halaman modul tersebut.
   - Klik di luar kolom pencarian, tekan tombol `/`, dan verifikasi kursor kembali terfokus ke dalam kolom pencarian.
   - Tekan `Alt + 1` (atau `⌥ + 1`) dan verifikasi terjadi pengalihan halaman instan ke modul pertama.
3. **Responsive Web**:
   - Gunakan mobile view inspect element.
   - Verifikasi panel menyusut dengan rapi, deskripsi panjang disembunyikan secara visual atau dirampingkan agar tidak overflow.
