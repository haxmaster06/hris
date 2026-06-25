<?php

declare(strict_types=1);

namespace Modules\Compensation\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Benefit extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Compensation\Database\Factories\BenefitFactory
    {
        return \Modules\Compensation\Database\Factories\BenefitFactory::new();
    }

    protected $fillable = [
        'name',
        'type', // health_insurance, bpjs, allowance, other
        'provider',
        'company_contribution',
        'employee_contribution',
        'description',
        'is_active',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'company_contribution' => 'decimal:2',
        'employee_contribution' => 'decimal:2',
        'is_active' => 'boolean',
        'version' => 'integer',
    ];

    public function employeeBenefits(): HasMany
    {
        return $this->hasMany(EmployeeBenefit::class);
    }
}
