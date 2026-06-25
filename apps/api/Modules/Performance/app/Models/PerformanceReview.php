<?php

declare(strict_types=1);

namespace Modules\Performance\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\Employee\Models\Employee;

class PerformanceReview extends BaseModel
{
    use HasFactory;

    protected $table = 'performance_reviews';

    protected static function newFactory(): \Modules\Performance\Database\Factories\PerformanceReviewFactory
    {
        return \Modules\Performance\Database\Factories\PerformanceReviewFactory::new();
    }

    protected $fillable = [
        'performance_period_id',
        'employee_id',
        'kpi_score',
        'self_score',
        'self_comment',
        'manager_score',
        'manager_comment',
        'manager_id',
        'hr_score',
        'hr_comment',
        'hr_reviewer_id',
        'final_score',
        'rating',
        'status',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'kpi_score' => 'decimal:2',
        'self_score' => 'decimal:2',
        'manager_score' => 'decimal:2',
        'hr_score' => 'decimal:2',
        'final_score' => 'decimal:2',
        'version' => 'integer',
    ];

    public function period(): BelongsTo
    {
        return $this->belongsTo(PerformancePeriod::class, 'performance_period_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    public function hrReviewer(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'hr_reviewer_id');
    }

    public function improvementPlan(): HasOne
    {
        return $this->hasOne(ImprovementPlan::class, 'performance_review_id');
    }
}
