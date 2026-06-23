---
trigger: always_on
---

# Standarisasi Namespace FilamentPHP

## Latar Belakang & Masalah
Sistem sebelumnya mengalami kendala **Infinite Loop** (lebih dari 2 menit load) yang disebabkan oleh referensi namespace class yang salah. Kesalahan import memicu proses pencarian rekursif `FileTypeFilterIterator` pada fungsi auto-discovery Laravel / Filament, yang menyebabkan crash pada autoloader (`Maximum execution time exceeded`). Selain itu lambatnya loading bisa terjadi karena Cache tidak optimal.

## A. Aturan Namespace Import (WAJIB)

Ketika membuat *Resource*, *Page*, atau *Form*, **WAJIB** memperhatikan namespace yang di-import:

1. **Komponen Layout (Grid, Section, Split, dsb.)**
   - ❌ SALAH: `use Filament\Forms\Components\Grid;`
   - ✅ BENAR: `use Filament\Schemas\Components\Grid;`
   - ✅ BENAR: `use Filament\Schemas\Components\Section;`
   *(Mulai dari Filament versi tertentu, layout components dipindah ke namespace `Schemas`)*

2. **Komponen Input (TextInput, Select, dsb.)**
   - ✅ BENAR: `use Filament\Forms\Components\TextInput;`
   - ✅ BENAR: `use Filament\Forms\Components\Select;`
   *(Tetap menggunakan namespace `Forms`)*

3. **Infolists / View**
   - ✅ BENAR: `use Filament\Infolists\Components\TextEntry;`

4. **Class Form (Jika tidak dipakai, JANGAN di-import)**
   - ❌ SALAH: `use Filament\Forms\Form;` (Apabila class `Form` sebenarnya tidak ada di versi yang digunakan)
   - ✅ BENAR: `use Filament\Schemas\Schema;` (Sebagai pengganti di context tertentu)

## B. Aturan Penambahan Modul & Discovery
Setiap penambahan Modul baru yang mendaftarkan Page/Resource ke `AdminPanelProvider`:
- **JANGAN PERNAH** mendaftarkan discovery dua kali (`->discoverPages(...)`) untuk namespace yang sama. Ini melipatgandakan beban file-system scan. Cukup panggil **satu kali** per modul.

## C. Performa & Caching (Environment)
Untuk mencegah bottleneck di environment development / production:
1. **Zend OPcache**: Selalu pastikan `zend_extension=opcache` aktif dengan parameter `opcache.enable=1` dan `opcache.enable_cli=1`. Tanpa OPcache, ribuan file akan di-compile ulang setiap request.
2. **Redis**: Gunakan Redis (client `predis`) untuk `SESSION_DRIVER`, `CACHE_STORE`, dan `QUEUE_CONNECTION` daripada menggunakan `database`. Menghindari database terbebani oleh lock session I/O.
3. **Autoload Optimization**: Setelah ada perubahan banyak file, pastikan perintah `php artisan optimize:clear` tidak *hang*. Jika *hang*, cek kembali import namespace yang salah menggunakan regex pencarian.
