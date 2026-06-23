<?php

declare(strict_types=1);

namespace Modules\Employee\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeFamily extends BaseModel
{
    use HasFactory;

    protected $table = 'employee_family';

    protected static function newFactory(): \Modules\Employee\Database\Factories\EmployeeFamilyFactory
    {
        return \Modules\Employee\Database\Factories\EmployeeFamilyFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'name',
        'relationship',
        'birth_date',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'version' => 'integer',
    ];

    /**
     * Get the employee that owns the family member.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
