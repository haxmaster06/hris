<?php

declare(strict_types=1);

namespace Modules\Payroll\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollPeriod extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Payroll\Database\Factories\PayrollPeriodFactory
    {
        return \Modules\Payroll\Database\Factories\PayrollPeriodFactory::new();
    }

    protected $fillable = [
        'month',
        'year',
        'name',
        'start_date',
        'end_date',
        'cut_off_date',
        'payment_date',
        'status', // draft, processing, calculated, approved, locked, paid
        'processed_at',
        'processed_by',
        'approved_by',
        'approved_at',
        'locked_by',
        'locked_at',
        'notes',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'month' => 'integer',
        'year' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'cut_off_date' => 'date',
        'payment_date' => 'date',
        'processed_at' => 'datetime',
        'approved_at' => 'datetime',
        'locked_at' => 'datetime',
        'version' => 'integer',
    ];

    public function payrollRuns(): HasMany
    {
        return $this->hasMany(PayrollRun::class);
    }
}
