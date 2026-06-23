<?php

declare(strict_types=1);

namespace Modules\Employee\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;
use Modules\Organization\Models\Company;
use Modules\Organization\Models\Branch;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Position;

class Employee extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Employee\Database\Factories\EmployeeFactory
    {
        return \Modules\Employee\Database\Factories\EmployeeFactory::new();
    }

    protected $fillable = [
        'user_id',
        'company_id',
        'branch_id',
        'department_id',
        'position_id',
        'employee_number',
        'first_name',
        'last_name',
        'gender',
        'birth_date',
        'join_date',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'join_date' => 'date',
        'version' => 'integer',
    ];

    /**
     * Get the user account for the employee.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the company of the employee.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the branch of the employee.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the department of the employee.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the position of the employee.
     */
    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    /**
     * Get family members of the employee.
     */
    public function family(): HasMany
    {
        return $this->hasMany(EmployeeFamily::class);
    }

    /**
     * Get education history of the employee.
     */
    public function education(): HasMany
    {
        return $this->hasMany(EmployeeEducation::class);
    }

    /**
     * Get work experience history of the employee.
     */
    public function experience(): HasMany
    {
        return $this->hasMany(EmployeeExperience::class);
    }

    /**
     * Get employment history logs of the employee.
     */
    public function histories(): HasMany
    {
        return $this->hasMany(EmployeeHistory::class);
    }
}
