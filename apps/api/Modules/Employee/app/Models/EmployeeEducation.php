<?php

declare(strict_types=1);

namespace Modules\Employee\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeEducation extends BaseModel
{
    use HasFactory;

    protected $table = 'employee_education';

    protected static function newFactory(): \Modules\Employee\Database\Factories\EmployeeEducationFactory
    {
        return \Modules\Employee\Database\Factories\EmployeeEducationFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'institution',
        'degree',
        'major',
        'graduation_year',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'graduation_year' => 'integer',
        'version' => 'integer',
    ];

    /**
     * Get the employee that owns the education record.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
