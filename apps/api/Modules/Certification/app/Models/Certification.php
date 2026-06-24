<?php

declare(strict_types=1);

namespace Modules\Certification\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Certification extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Certification\Database\Factories\CertificationFactory
    {
        return \Modules\Certification\Database\Factories\CertificationFactory::new();
    }

    protected $fillable = [
        'name',
        'code',
        'issuer',
        'validity_period',
    ];

    protected $casts = [
        'validity_period' => 'integer',
    ];

    /**
     * Get the certification history logs of employees.
     */
    public function employeeCertifications(): HasMany
    {
        return $this->hasMany(EmployeeCertification::class);
    }

    /**
     * Get the certification requirements (matrix) for positions.
     */
    public function requirements(): HasMany
    {
        return $this->hasMany(CertificationRequirement::class);
    }
}
