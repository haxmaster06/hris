<?php

declare(strict_types=1);

namespace Modules\Talent\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class SuccessionPlan extends BaseModel
{
    use HasFactory;

    protected $table = 'succession_plans';

    protected static function newFactory(): \Modules\Talent\Database\Factories\SuccessionPlanFactory
    {
        return \Modules\Talent\Database\Factories\SuccessionPlanFactory::new();
    }

    protected $fillable = [
        'position_id',
        'incumbent_employee_id',
        'candidate_employee_id',
        'readiness_level',
        'potential_score',
        'performance_score',
        'development_actions',
        'notes',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'potential_score' => 'decimal:2',
        'performance_score' => 'decimal:2',
        'development_actions' => 'array',
        'version' => 'integer',
    ];

    public function position(): BelongsTo
    {
        return $this->belongsTo(\Modules\Organization\Models\Position::class, 'position_id');
    }

    public function incumbent(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'incumbent_employee_id');
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'candidate_employee_id');
    }
}
