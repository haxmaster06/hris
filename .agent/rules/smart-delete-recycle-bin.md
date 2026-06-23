---
trigger: always_on
---

# Standarisasi Penghapusan Data & Integrasi Recycle Bin

## A. SmartDeleteAction (WAJIB)

Setiap Resource yang model-nya menggunakan `SoftDeletes`, **WAJIB** menggunakan `SmartDeleteAction` dari `Modules\Core\Filament\Actions`, **BUKAN** `Actions\DeleteAction` bawaan Filament.

### Pola Standar pada `table()`:
```php
->actions([
    Actions\ActionGroup::make([
        // ... action lain (View, Edit)
        \Modules\Core\Filament\Actions\SmartDeleteAction::make()->label('Hapus'),
        Actions\RestoreAction::make(),
        Actions\ForceDeleteAction::make(),
    ]),
])
->bulkActions([
    Actions\BulkActionGroup::make([
        \Modules\Core\Filament\Actions\SmartDeleteBulkAction::make()->label('Hapus Terpilih'),
        Actions\RestoreBulkAction::make()->label('Pulihkan Terpilih'),
        Actions\ForceDeleteBulkAction::make()->label('Hapus Permanen'),
    ]),
])
```

### Komponen Pendukung WAJIB:
1. **Filter**: Tambahkan `Tables\Filters\TrashedFilter::make()` pada `->filters([])`
2. **Eloquent Query**: Override `getEloquentQuery()` untuk menonaktifkan `SoftDeletingScope`
```php
public static function getEloquentQuery(): Builder
{
    return parent::getEloquentQuery()
        ->withoutGlobalScopes([SoftDeletingScope::class]);
}
```

### DILARANG:
- ❌ Menggunakan `Actions\DeleteAction::make()` langsung (tanpa checkbox permanen)
- ❌ Menggunakan `Actions\DeleteBulkAction::make()` langsung
- ❌ Lupa menambahkan `TrashedFilter`
- ❌ Lupa override `getEloquentQuery()` untuk SoftDeletes

---

## B. Integrasi Recycle Bin (WAJIB)

Setiap kali membuat **modul baru**, **fitur baru**, atau **sub-modul baru** yang model-nya menggunakan `SoftDeletes`, **WAJIB** melakukan 3 langkah berikut:

### Langkah 1: Buat Resource di Modul RecycleBin
Buat file `DeletedXxxResource.php` di `Modules/RecycleBin/app/Filament/Resources/` mengikuti pola:
```
Modules/RecycleBin/app/Filament/Resources/
├── DeletedXxxResource.php
└── DeletedXxxResource/
    └── Pages/
        └── ListDeletedXxx.php
```

Contoh pola Resource (ikuti `DeletedRoleResource` sebagai referensi):
- `$shouldRegisterNavigation = false`
- `$slug = 'recycle-bin/deleted-xxx'`
- Query: `->withoutGlobalScopes([SoftDeletingScope::class])->onlyTrashed()`
- Actions: `Actions\RestoreAction::make()`, `Actions\ForceDeleteAction::make()`
- Import: `use Filament\Actions;` (namespace `Filament\Actions`, BUKAN `Filament\Tables\Actions`)

### Langkah 2: Tambahkan ke Dashboard RecycleBin
Tambahkan entry baru di `RecycleBinDashboard.php` → method `getStats()` pada grup yang sesuai:
```php
[
    'label' => 'Nama Fitur',
    'count' => \Modules\Xxx\Models\Xxx::onlyTrashed()->count(),
    'icon' => 'heroicon-o-xxx',
    'url' => \Modules\RecycleBin\Filament\Resources\DeletedXxxResource::getUrl(),
    'color' => 'warning',
    'description' => 'Deskripsi singkat',
    'permission' => 'xxx.view',
],
```

### Langkah 3: Tambahkan Back Button di List Page
Pada `ListDeletedXxx.php`, tambahkan tombol kembali ke RecycleBin Dashboard:
```php
use Modules\RecycleBin\Filament\Pages\RecycleBinDashboard;

protected function getHeaderActions(): array
{
    return [
        Actions\Action::make('backToModule')
            ->label('Kembali ke Recycle Bin')
            ->icon('heroicon-m-chevron-left')
            ->color('gray')
            ->url(RecycleBinDashboard::getUrl()),
    ];
}
```

### Grup Kategori di RecycleBinDashboard:
| Grup | Untuk modul |
|---|---|
| Sales & Marketing | SalesOrder, Quotation, SPK, Proforma, Exim |
| Purchasing | PurchaseOrder, BudgetRequest |
| Manufacturing | BOM, ProductionOrder, WorkOrder |
| Inventory & Master Data | Product, Category, Unit, Supplier, Warehouse, GoodsReceipt |
| Quality Control | QualityParameter, InspectionStandard, QualityInspection |
| Accounting & Finance | Account, Journal |
| Document Management | Document, DocumentCategory |
| System & Security | User, Employee, Role, Department, WorkflowDefinition |
