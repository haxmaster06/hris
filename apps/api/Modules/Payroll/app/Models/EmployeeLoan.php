<?php

declare(strict_types=1);

namespace Modules\Payroll\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class EmployeeLoan extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Payroll\Database\Factories\EmployeeLoanFactory
    {
        return \Modules\Payroll\Database\Factories\EmployeeLoanFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'loan_number',
        'principal_amount',
        'remaining_amount',
        'installment_amount',
        'total_installments',
        'paid_installments',
        'start_date',
        'end_date',
        'status', // active, completed, cancelled
        'reason',
        'approved_by',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'principal_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'installment_amount' => 'decimal:2',
        'total_installments' => 'integer',
        'paid_installments' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'version' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
