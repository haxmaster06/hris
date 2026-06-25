<?php

declare(strict_types=1);

namespace Modules\Payroll\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Employee\Models\Employee;

class PayrollRun extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Payroll\Database\Factories\PayrollRunFactory
    {
        return \Modules\Payroll\Database\Factories\PayrollRunFactory::new();
    }

    protected $fillable = [
        'payroll_period_id',
        'employee_id',
        'basic_salary',
        'total_earnings',
        'total_deductions',
        'gross_salary',
        'tax_amount',
        'bpjs_tk_employee',
        'bpjs_tk_company',
        'bpjs_kes_employee',
        'bpjs_kes_company',
        'net_salary',
        'take_home_pay',
        'tax_method',
        'working_days',
        'present_days',
        'absent_days',
        'late_count',
        'overtime_hours',
        'overtime_amount',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'total_earnings' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'gross_salary' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'bpjs_tk_employee' => 'decimal:2',
        'bpjs_tk_company' => 'decimal:2',
        'bpjs_kes_employee' => 'decimal:2',
        'bpjs_kes_company' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'take_home_pay' => 'decimal:2',
        'working_days' => 'integer',
        'present_days' => 'integer',
        'absent_days' => 'integer',
        'late_count' => 'integer',
        'overtime_hours' => 'decimal:2',
        'overtime_amount' => 'decimal:2',
        'version' => 'integer',
    ];

    public function payrollPeriod(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function payrollRunDetails(): HasMany
    {
        return $this->hasMany(PayrollRunDetail::class);
    }
}
