<?php

declare(strict_types=1);

namespace Modules\Organization\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Organization\Database\Factories\CompanyFactory
    {
        return \Modules\Organization\Database\Factories\CompanyFactory::new();
    }
    protected $fillable = [
        'name',
        'code',
        'tax_number',
        'address',
        'phone',
        'email',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    /**
     * Get the branches for the company.
     */
    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }
}
