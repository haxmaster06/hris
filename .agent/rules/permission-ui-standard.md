---
trigger: always_on
---

# Standarisasi UI Role & Permission

Aturan ini wajib diikuti saat membuat, mengubah, atau merender komponen Role dan Hak Akses (Permission) di dalam Filament Resource (khususnya `RoleResource` atau form permission serupa). Standarisasi ini bertujuan untuk mencegah label text yang terpotong dan menjaga tampilan yang *compact* serta mudah dibaca.

## 1. Struktur Layout Utama (Fieldset)
- Gunakan `Fieldset` untuk mengelompokkan *permissions* berdasarkan sumber/fitur (misal: "Document Type", "Penawaran (Quotation)").
- Berikan label pada `Fieldset` dengan tipe bahasa Indonesia yang relevan dari nama *resource group*.
- **Grid Container**: Container (umumnya `Section` modul) yang menaungi list `Fieldset` *wajib* diatur tata letaknya agar memakan *full width* tetapi tersusun berdampingan jika ukuran layar mengizinkan. Disarankan menggunakan:
  ```php
  \Filament\Schemas\Components\Grid::make([
      'default' => 1,
      'md' => 2,
      'xl' => 3,
      '2xl' => 4,
  ])
  ```
  Ini akan secara optimal memanfaatkan layar besar, sambil mencegah *overflow* box.

## 2. Struktur List Checkbox (CheckboxList)
- Opsi Hak Akses di dalam tiap fitur WAJIB menggunakan `CheckboxList`.
- Karena `Fieldset` Filament v3 punya *base layout* berupa 2-kolom bawaan, maka `CheckboxList` *WAJIB* di-set menggunakan **`->columnSpanFull()`** agar bisa mengambil alih beban ruang kolom secara penuh tanpa membuat ruang kosong di sisi kanan box.
- Di dalam `CheckboxList` tersebut, atur alokasi kolom menjadi 1:
  ```php
  Forms\Components\CheckboxList::make('permissions_' . $groupName)
      ->options($options)
      ->columns(1)
      ->columnSpanFull()
  ```
  Dengan ini *checkbox list* akan tertata rapi dari atas ke bawah (vertikal) per satu kolom secara elegan, namun dengan lebar area tulis (*width label*) tidak terbatas (merentang menutupi lebar *box* utama `Fieldset`).

## 3. Label Text (Penamaan Hak Akses)
- **TIDAK TERPOTONG**: Label dilarang menggunakan batasan potong text seperti kelas tailwind `truncate` atau `whitespace-nowrap`. Biarkan *text wrapping* secara *default* / melentur sealami yang disediakan *theme* Filament jika ukuran layar terlalu sempit. Keleluasaan pembacaan *text* (apalagi string Indonesia panjang) jauh lebih krusial.
- Gunakan field `display_name` dari database tabel permission (melalui seeder) sebagai *source of truth* *labeling*, lalu lengkapi dengan prefix *emotikon visual (icon)* untuk merepresentasikan *action* spesifik seperti 👁️, ➕, ✏️, 🗑️.
- Jangan gunakan *slug text* (*snake_case*) secara mentah pada daftar *checkbox*, format secara rapi menjadi *Title Case* atau gunakan translasi bahasa jika `display_name` kosong.

## 4. Accordion & Section State
- Demi menghemat tinggi *scroll* dan kemudahan pengguna menemukan form yang panjang secara bertingkat: 
  - Bagian Section Master ("📋 Hak Akses Detail") *WAJIB* memiliki `->collapsed()`.
  - Bagian sub-Section (kategori per-Modul, seperti "Penjualan", "Gudang") *WAJIB* diset as `->collapsed()`. 
  Laman ini ditutup secara *default* karena daftar *checkboxes permission* tersebut mencapai ratusan item.
