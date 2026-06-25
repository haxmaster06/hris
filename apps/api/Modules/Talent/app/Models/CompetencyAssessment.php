<?php

declare(strict_types=1);

namespace Modules\Talent\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class CompetencyAssessment extends BaseModel
{
    use HasFactory;

    protected $table = 'competency_assessments';

    protected static function newFactory(): \Modules\Talent\Database\Factories\CompetencyAssessmentFactory
    {
        return \Modules\Talent\Database\Factories\CompetencyAssessmentFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'assessor_id',
        'assessment_date',
        'status',
        'overall_score',
        'notes',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'assessment_date' => 'date',
        'overall_score' => 'decimal:2',
        'version' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function assessor(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assessor_id');
    }
}
