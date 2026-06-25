<?php

declare(strict_types=1);

namespace Modules\Compensation\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class EmployeeBenefit extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Compensation\Database\Factories\EmployeeBenefitFactory
    {
        return \Modules\Compensation\Database\Factories\EmployeeBenefitFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'benefit_id',
        'start_date',
        'end_date',
        'status', // active, suspended, terminated
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

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function benefit(): BelongsTo
    {
        return $this->belongsTo(Benefit::class);
    }
}
