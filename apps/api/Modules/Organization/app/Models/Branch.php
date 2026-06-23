<?php

declare(strict_types=1);

namespace Modules\Organization\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Organization\Database\Factories\BranchFactory
    {
        return \Modules\Organization\Database\Factories\BranchFactory::new();
    }
    protected $fillable = [
        'company_id',
        'name',
        'code',
        'address',
        'phone',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    /**
     * Get the company that owns the branch.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the departments for the branch.
     */
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }
}
