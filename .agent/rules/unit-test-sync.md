---
trigger: always_on
---

# Unit Test Synchronization Rule

Rule ini WAJIB dipatuhi setiap kali ada perubahan pada Modul, Fitur, Logic, atau Flow di dalam project ini.

## PRINSIP
- Setiap perubahan kode HARUS diikuti dengan penyesuaian unit test
- Unit test adalah bagian TIDAK TERPISAHKAN dari setiap deliverable
- Test harus HIJAU (passing) sebelum pekerjaan dianggap selesai

## KAPAN BERLAKU

### 1. Pembuatan Modul / Fitur Baru
WAJIB:
- Buat file test baru di `Modules/{NamaModul}/Tests/Unit/`
- Buat factory baru di `Modules/{NamaModul}/database/factories/` yang sesuai schema migration
- Pastikan factory definition 100% aligned dengan migration columns (tidak boleh ada field yang tidak ada di migration, dan semua required field harus ada)
- Minimum test coverage:
  - Model relationships (belongsTo, hasMany, morphTo, dll)
  - Model attribute casting (dates, decimals, booleans, arrays)
  - Auto-generated fields (nomor otomatis, status default)
  - Scope queries (scopeActive, scopeByModule, dll)
  - Business logic methods (approve, reject, calculate, dll)

### 2. Update / Perubahan Logic
WAJIB:
- Review test yang terdampak dan update sesuai perubahan
- Tambah test case baru jika ada logic branch baru
- Pastikan test lama tetap HIJAU setelah perubahan
- Jika mengubah migration schema, WAJIB update factory definition yang terkait

### 3. Update / Perubahan Flow
WAJIB:
- Update test untuk mencerminkan flow baru
- Tambah test untuk state transitions (draft → submitted → approved → rejected)
- Test edge cases pada flow (misalnya: reject setelah approve, double submit, dll)

### 4. Penambahan Relasi Antar Model
WAJIB:
- Test relasi dari kedua sisi (parent dan child)
- Test cascade behavior (cascade delete, set null, dll)
- Update factory jika ada foreign key baru

### 5. Perubahan Schema / Migration
WAJIB:
- Update SEMUA factory yang terkait dengan tabel yang berubah
- Jalankan test untuk memvalidasi tidak ada field mismatch
- Perhatikan khusus:
  - Field tanpa default value HARUS ada di factory
  - Foreign key HARUS menggunakan `Model::factory()` bukan hardcoded ID
  - Polymorphic relations HARUS diisi dengan valid type dan valid ID

## STANDAR PENULISAN TEST

### Konvensi Penamaan
- File: `{ModelName}Test.php`
- Method: `test_{deskripsi_snake_case}` (contoh: `test_budget_request_number_generation`)
- Lokasi: `Modules/{NamaModul}/Tests/Unit/`

### Base Class
- Semua test WAJIB extend `Tests\ModuleTestCase`
- Gunakan `RefreshDatabase` trait (sudah ada di ModuleTestCase)

### Data Seeding dalam Test
- Gunakan `factory()->create()` untuk data unik
- Gunakan `firstOrCreate()` untuk data yang mungkin sudah ada (misalnya: Currency default 'IDR')
- DILARANG hardcode foreign key ID (misalnya `'product_id' => 1`)
- DILARANG menggunakan `clone clone` (double clone syntax)

### Validasi Minimum Per Model
```php
// 1. Relationships
public function test_model_relationships(): void
{
    $model = Model::factory()->create();
    $this->assertNotNull($model->relatedModel);
    $this->assertInstanceOf(RelatedModel::class, $model->relatedModel);
}

// 2. Attribute Casting
public function test_model_attributes_casting(): void
{
    $model = Model::factory()->create();
    $this->assertInstanceOf(Carbon::class, $model->date_field);
    $this->assertIsBool($model->boolean_field);
}

// 3. Business Logic
public function test_specific_business_method(): void
{
    $model = Model::factory()->create(['status' => 'draft']);
    $model->submit();
    $this->assertEquals('submitted', $model->fresh()->status);
}
```

## CHECKLIST SEBELUM SELESAI
- [ ] Jalankan `php artisan test` untuk seluruh suite
- [ ] Tidak ada test yang FAIL
- [ ] Tidak ada test yang SKIP tanpa alasan
- [ ] Factory definition match dengan migration schema
- [ ] Semua model baru punya minimal 1 test file

## JIKA MENEMUKAN TEST YANG FAIL
1. Analisa error message (QueryException = schema mismatch, dll)
2. Cek migration schema vs factory definition
3. Cek model $fillable dan $casts
4. Fix root cause, BUKAN suppress error
5. Jalankan ulang test sampai HIJAU
