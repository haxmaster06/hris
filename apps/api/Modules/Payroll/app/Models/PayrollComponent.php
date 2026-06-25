<?php

declare(strict_types=1);

namespace Modules\Payroll\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PayrollComponent extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Payroll\Database\Factories\PayrollComponentFactory
    {
        return \Modules\Payroll\Database\Factories\PayrollComponentFactory::new();
    }

    protected $fillable = [
        'code',
        'name',
        'type', // earning, deduction
        'category', // basic_salary, fixed_allowance, variable_allowance, overtime, tax, bpjs, loan, penalty
        'is_taxable',
        'is_active',
        'description',
        'sort_order',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'is_taxable' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'version' => 'integer',
    ];
}
