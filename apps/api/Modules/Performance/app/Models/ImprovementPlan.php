<?php

declare(strict_types=1);

namespace Modules\Performance\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class ImprovementPlan extends BaseModel
{
    use HasFactory;

    protected $table = 'improvement_plans';

    protected static function newFactory(): \Modules\Performance\Database\Factories\ImprovementPlanFactory
    {
        return \Modules\Performance\Database\Factories\ImprovementPlanFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'performance_review_id',
        'title',
        'reason',
        'action_items',
        'start_date',
        'end_date',
        'status',
        'supervisor_id',
        'outcome_notes',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'action_items' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
        'version' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function review(): BelongsTo
    {
        return $this->belongsTo(PerformanceReview::class, 'performance_review_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'supervisor_id');
    }
}
