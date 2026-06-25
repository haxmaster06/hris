<?php

declare(strict_types=1);

namespace Modules\Performance\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KPI extends BaseModel
{
    use HasFactory;

    protected $table = 'kpis';

    protected static function newFactory(): \Modules\Performance\Database\Factories\KPIFactory
    {
        return \Modules\Performance\Database\Factories\KPIFactory::new();
    }

    protected $fillable = [
        'code',
        'name',
        'description',
        'category',
        'unit',
        'measurement_type',
        'position_id',
        'is_active',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'version' => 'integer',
    ];

    public function assignments(): HasMany
    {
        return $this->hasMany(KPIAssignment::class, 'kpi_id');
    }
}
