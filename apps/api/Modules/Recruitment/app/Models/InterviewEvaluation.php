<?php

declare(strict_types=1);

namespace Modules\Recruitment\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class InterviewEvaluation extends BaseModel
{
    use HasFactory;

    protected $table = 'interview_evaluations';

    protected static function newFactory(): \Modules\Recruitment\Database\Factories\InterviewEvaluationFactory
    {
        return \Modules\Recruitment\Database\Factories\InterviewEvaluationFactory::new();
    }

    protected $fillable = [
        'interview_id',
        'evaluator_id',
        'criteria',
        'overall_score',
        'recommendation',
        'comments',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'criteria' => 'json',
        'overall_score' => 'decimal:2',
        'version' => 'integer',
    ];

    public function interview(): BelongsTo
    {
        return $this->belongsTo(Interview::class, 'interview_id');
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'evaluator_id');
    }
}
