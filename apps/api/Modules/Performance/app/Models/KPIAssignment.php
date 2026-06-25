<?php

declare(strict_types=1);

namespace Modules\Performance\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class KPIAssignment extends BaseModel
{
    use HasFactory;

    protected $table = 'kpi_assignments';

    protected static function newFactory(): \Modules\Performance\Database\Factories\KPIAssignmentFactory
    {
        return \Modules\Performance\Database\Factories\KPIAssignmentFactory::new();
    }

    protected $fillable = [
        'kpi_id',
        'employee_id',
        'performance_period_id',
        'target_value',
        'actual_value',
        'weight',
        'score',
        'notes',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'target_value' => 'decimal:2',
        'actual_value' => 'decimal:2',
        'weight' => 'decimal:2',
        'score' => 'decimal:2',
        'version' => 'integer',
    ];

    public function kpi(): BelongsTo
    {
        return $this->belongsTo(KPI::class, 'kpi_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(PerformancePeriod::class, 'performance_period_id');
    }
}
