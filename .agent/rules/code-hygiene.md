---
trigger: always_on
---

# Code Hygiene & Clean Architecture

ATURAN WAJIB (GLOBAL INVARIANTS) DALAM PENGEMBANGAN TERUS-MENERUS:

1. **BEST PRACTICE LARAVEL & FILAMENT**
   - Selalu patuhi standar penulisan PSR-12, tata nama (`Naming Conventions`), dan struktur modular yang sedang berjalan tanpa improvisasi di luar kebiasaan proyek.
   - Pemanfaatan *Single Source of Truth* dalam bisnis proses maupun data.

2. **CLEAN ARCHITECTURE & MAINTAINABILITY**
   - Arsitektur harus dibuat seri mungkin agar mudah di *maintain*. Jangan mencampur aduk bussiness logic di dalam UI (Filament Page/Resource) jika hal tersebut menuntut proses integrasi kompleks (Gunakan Action/Service Class).
   - Selalu pertimbangkan stabilitas sistem serta _scalability_ untuk ke depannya di setiap keputusan teknis yang ditambahkan.

3. **CLEANUP BEKAS DEBUGGING**
   - Wajib meninjau kembali koding yang telah selesai dan MENGHAPUS jejak-jejak proses perbaikan (misal: `dd()`, `dump()`, `Log::info()` berlebih, file dummy di `/tmp`, atau komentar-komentar code tidak berguna / ter-comment-out) sebelum di commit atau dimatangkan.

4. **KONSISTENSI & KEWASPADAAN**
   - Jika mengubah komponen relasi, maka harus dilakukan pengecekan pada komponen dependent (efek domino).
   - Pastikan setiap modul berdiri mandiri dan memiliki _boundary_ (batasan) yang rapi dan terisolasi dengan baik.
