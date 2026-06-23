<?php

declare(strict_types=1);

namespace Modules\Employee\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeExperience extends BaseModel
{
    use HasFactory;

    protected $table = 'employee_experience';

    protected static function newFactory(): \Modules\Employee\Database\Factories\EmployeeExperienceFactory
    {
        return \Modules\Employee\Database\Factories\EmployeeExperienceFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'company_name',
        'position',
        'start_date',
        'end_date',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'version' => 'integer',
    ];

    /**
     * Get the employee that owns the experience record.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
