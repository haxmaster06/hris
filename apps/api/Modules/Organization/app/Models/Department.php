<?php

declare(strict_types=1);

namespace Modules\Organization\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Organization\Database\Factories\DepartmentFactory
    {
        return \Modules\Organization\Database\Factories\DepartmentFactory::new();
    }
    protected $fillable = [
        'branch_id',
        'parent_id',
        'name',
        'code',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    /**
     * Get the branch that owns the department.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the parent department.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    /**
     * Get the child departments.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Department::class, 'parent_id');
    }

    /**
     * Get the divisions for the department.
     */
    public function divisions(): HasMany
    {
        return $this->hasMany(Division::class);
    }

    /**
     * Get the positions for the department.
     */
    public function positions(): HasMany
    {
        return $this->hasMany(Position::class);
    }
}
