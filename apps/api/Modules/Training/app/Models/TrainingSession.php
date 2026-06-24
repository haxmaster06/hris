<?php

declare(strict_types=1);

namespace Modules\Training\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Employee\Models\Employee;

class TrainingSession extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Training\Database\Factories\TrainingSessionFactory
    {
        return \Modules\Training\Database\Factories\TrainingSessionFactory::new();
    }

    protected $fillable = [
        'training_id',
        'trainer',
        'venue',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    /**
     * Get the master training parent.
     */
    public function training(): BelongsTo
    {
        return $this->belongsTo(Training::class);
    }

    /**
     * Get the participants relations.
     */
    public function participants(): HasMany
    {
        return $this->hasMany(TrainingParticipant::class);
    }

    /**
     * Get the enrolled employees.
     */
    public function employees(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'training_participants', 'training_session_id', 'employee_id')
            ->withPivot(['id', 'attendance_status', 'result_status', 'score', 'remarks'])
            ->withTimestamps();
    }
}
