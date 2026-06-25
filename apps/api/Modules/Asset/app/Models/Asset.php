<?php

declare(strict_types=1);

namespace Modules\Asset\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asset extends BaseModel
{
    use HasFactory;

    protected $table = 'assets';

    protected static function newFactory(): \Modules\Asset\Database\Factories\AssetFactory
    {
        return \Modules\Asset\Database\Factories\AssetFactory::new();
    }

    protected $fillable = [
        'asset_number',
        'name',
        'category',
        'brand',
        'model',
        'serial_number',
        'specifications',
        'purchase_date',
        'purchase_price',
        'vendor',
        'condition',
        'status',
        'location',
        'warranty_expiry',
        'notes',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'purchase_price' => 'decimal:2',
        'warranty_expiry' => 'date',
        'version' => 'integer',
    ];

    public function assignments(): HasMany
    {
        return $this->hasMany(AssetAssignment::class, 'asset_id');
    }
}
