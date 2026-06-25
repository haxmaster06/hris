<?php

declare(strict_types=1);

namespace Modules\Recruitment\Models;

use App\Models\BaseModel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Interview extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Recruitment\Database\Factories\InterviewFactory
    {
        return \Modules\Recruitment\Database\Factories\InterviewFactory::new();
    }

    protected $fillable = [
        'job_application_id',
        'interview_date',
        'interviewer_id',
        'notes',
        'score',
        'status',
    ];

    protected $casts = [
        'interview_date' => 'datetime',
        'score' => 'integer',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class, 'job_application_id');
    }

    public function interviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'interviewer_id');
    }

    public function evaluation(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(InterviewEvaluation::class, 'interview_id');
    }
}
