---
trigger: always_on
---

# Standarisasi Update Dokumentasi Flow ERP

## Aturan Wajib Update Dokumentasi

Setiap kali ada perubahan struktural maupun fungsional pada ERP HBM, Anda **WAJIB** memperbarui file dokumentasi utama berikut:
`docs/ERP_FULL_FLOW_GUIDE.md`

### Perubahan yang Memicu Update Dokumentasi:
1. **Penambahan Modul Baru**: Jika Anda membuat modul baru (baik itu master, operasional, atau pendukung).
2. **Penambahan Sub-modul atau Resource**: Jika ada resource Filament baru yang ditambahkan ke dalam menu dashboard modul mana pun.
3. **Perubahan Alur (Flow)**: Jika ada modifikasi pada urutan proses (misal: penambahan status baru pada PO, perubahan alur approval, integrasi modul yang sebelumnya berdiri sendiri).
4. **Perubahan Relasi Model**: Jika ditambahkan koneksi/relasi baru antar tabel yang melibatkan modul berbeda (misalnya koneksi HR ke Manufacturing).
5. **Penambahan Fitur Lintas Modul**: Seperti integrasi notifikasi baru, webhook, atau sinkronisasi data antar sistem.
6. **Perubahan Arsitektur**: Restrukturisasi direktori, penerapan trait/interface baru secara global.

### Prosedur Update:
- Edit file `docs/ERP_FULL_FLOW_GUIDE.md` secara langsung dengan menggunakan tool file modification.
- Update bagian yang relevan (seperti "Daftar Modul", "Peta Modul", "Detail per Modul", atau "Integrasi Data").
- Jika update tersebut signifikan dan mengubah tampilan Visual Flow, buat ulang *Flow Diagram* (gambar PNG) di folder `docs/flow/` menggunakan tools *generate_image* yang Anda miliki.
- Pastikan juga Anda meng-generate ulang versi HTML/PDF-nya menggunakan script `docs/generate_pdf.cjs` jika ada perubahan pada markdown.

**Tidak ada pengecualian untuk aturan ini. Dokumentasi `ERP_FULL_FLOW_GUIDE.md` harus selalu mencerminkan kondisi terbaru (source of truth) dari arsitektur dan fungsionalitas sistem ERP.**
