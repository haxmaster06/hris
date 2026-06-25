<?php

declare(strict_types=1);

namespace Modules\Payroll\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class EmployeeSalary extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Payroll\Database\Factories\EmployeeSalaryFactory
    {
        return \Modules\Payroll\Database\Factories\EmployeeSalaryFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'basic_salary',
        'tax_method', // gross, nett, gross_up
        'tax_status', // TK/0, K/0, K/1, K/2, K/3
        'bpjs_class', // 1, 2, 3
        'bank_name',
        'bank_account',
        'bank_holder_name',
        'effective_date',
        'notes',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'effective_date' => 'date',
        'version' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
