<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;
use Modules\Organization\Models\Position;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Branch;
use Modules\Organization\Models\Division;
use Modules\Organization\Models\Grade;
use App\Models\User;

class LifecycleEvent extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\EmployeeLifecycle\Database\Factories\LifecycleEventFactory
    {
        return \Modules\EmployeeLifecycle\Database\Factories\LifecycleEventFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'event_type',
        'effective_date',
        'from_position_id',
        'to_position_id',
        'from_department_id',
        'to_department_id',
        'from_branch_id',
        'to_branch_id',
        'from_division_id',
        'to_division_id',
        'from_grade_id',
        'to_grade_id',
        'from_status',
        'to_status',
        'from_salary',
        'to_salary',
        'reason',
        'notes',
        'approved_by',
        'approved_at',
        'document_path',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'approved_at' => 'datetime',
        'from_salary' => 'decimal:2',
        'to_salary' => 'decimal:2',
        'version' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function fromPosition(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'from_position_id');
    }

    public function toPosition(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'to_position_id');
    }

    public function fromDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'from_department_id');
    }

    public function toDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'to_department_id');
    }

    public function fromBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'from_branch_id');
    }

    public function toBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'to_branch_id');
    }

    public function fromDivision(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'from_division_id');
    }

    public function toDivision(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'to_division_id');
    }

    public function fromGrade(): BelongsTo
    {
        return $this->belongsTo(Grade::class, 'from_grade_id');
    }

    public function toGrade(): BelongsTo
    {
        return $this->belongsTo(Grade::class, 'to_grade_id');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
