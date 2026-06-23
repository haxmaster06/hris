---
trigger: always_on
---

# Standarisasi Pembuatan Planning

Setiap kali user meminta untuk membuat Planning / Implementation Plan, WAJIB mengikuti aturan berikut:

## Aturan Wajib Planning
1. **Detail** — Setiap langkah harus menjelaskan *apa*, *di mana*, *mengapa*, dan *bagaimana*. Sertakan nama file, nama kolom, tipe data, dan contoh value jika relevan.
2. **Sequential** — Langkah-langkah harus berurutan secara logis dan kronologis. Tidak boleh ada langkah yang bergantung pada langkah lain yang belum dikerjakan. Gunakan penomoran bertingkat (Fase → Step → Sub-step).
3. **Professional** — Gunakan bahasa yang formal, terstruktur, dan siap dijadikan dokumentasi teknis resmi proyek. Sertakan diagram atau tabel jika membantu pemahaman.
4. **Mudah difahami Programmer Junior dan AI Agent** — Hindari asumsi implisit. Jelaskan setiap istilah domain bisnis secara eksplisit. Setiap instruksi harus bisa dieksekusi tanpa perlu bertanya balik.
5. **Disimpan pada folder khusus** — Simpan file `.md` ke dalam folder `.plans/` di root project.
6. **Update Modul/Fitur Terkait** — Bila ada Fitur atau Modul tambahan, pastikan untuk merinci update pada Modul atau Fitur lain yang terdampak (dependencies, menu, dashboard, seeder, dll).

## Format Dokumen Planning
```markdown
# [Judul Planning]

## Ringkasan
Penjelasan singkat tujuan dan cakupan planning ini.

## Referensi Dokumen
Link ke dokumen logic / analisa bisnis yang mendasari planning ini.

## Kondisi Existing (Current State)
Apa yang sudah ada di sistem saat ini yang relevan.

## Target Akhir (Desired State)
Apa hasil akhir yang diharapkan setelah planning ini selesai.

## Fase N: [Nama Fase]
### Step N.1: [Nama Langkah]
- **Modul:** [Nama modul Laravel]
- **File:** [Path relatif file yang akan diubah/dibuat]
- **Aksi:** [CREATE / MODIFY / DELETE]
- **Detail:**
  - Penjelasan teknis spesifik
  - Nama kolom, tipe data, relasi
  - Contoh kode jika perlu
- **Validasi:** Cara memverifikasi langkah ini berhasil
- **Risiko:** Potensi masalah dan mitigasinya

## Checklist Verifikasi Akhir
Daftar pengujian yang harus dilakukan setelah semua fase selesai.
```

## Catatan
- Jangan campur aduk antara Planning dan Eksekusi. Planning murni dokumen perencanaan.
- Selalu tanyakan konfirmasi user sebelum mulai eksekusi.
- Update planning jika ada perubahan scope di tengah jalan.
