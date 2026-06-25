<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;
use App\Models\User;

class OnboardingChecklist extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\EmployeeLifecycle\Database\Factories\OnboardingChecklistFactory
    {
        return \Modules\EmployeeLifecycle\Database\Factories\OnboardingChecklistFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'category',
        'task_name',
        'description',
        'is_completed',
        'completed_at',
        'assigned_to',
        'due_date',
        'sort_order',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
        'due_date' => 'date',
        'sort_order' => 'integer',
        'version' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
