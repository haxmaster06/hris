<?php

declare(strict_types=1);

namespace Modules\Training\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class TrainingParticipant extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Training\Database\Factories\TrainingParticipantFactory
    {
        return \Modules\Training\Database\Factories\TrainingParticipantFactory::new();
    }

    protected $fillable = [
        'training_session_id',
        'employee_id',
        'attendance_status',
        'result_status',
        'score',
        'remarks',
        'pre_score',
        'post_score',
        'certificate_issued',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'pre_score' => 'decimal:2',
        'post_score' => 'decimal:2',
        'certificate_issued' => 'boolean',
    ];

    /**
     * Get the training session.
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(TrainingSession::class, 'training_session_id');
    }

    /**
     * Get the enrolled employee.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
