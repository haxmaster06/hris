<?php

declare(strict_types=1);

namespace Modules\Performance\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PerformancePeriod extends BaseModel
{
    use HasFactory;

    protected $table = 'performance_periods';

    protected static function newFactory(): \Modules\Performance\Database\Factories\PerformancePeriodFactory
    {
        return \Modules\Performance\Database\Factories\PerformancePeriodFactory::new();
    }

    protected $fillable = [
        'name',
        'type',
        'start_date',
        'end_date',
        'status',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'version' => 'integer',
    ];

    public function assignments(): HasMany
    {
        return $this->hasMany(KPIAssignment::class, 'performance_period_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(PerformanceReview::class, 'performance_period_id');
    }
}
