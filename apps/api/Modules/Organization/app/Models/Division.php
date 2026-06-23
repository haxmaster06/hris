<?php

declare(strict_types=1);

namespace Modules\Organization\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Division extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Organization\Database\Factories\DivisionFactory
    {
        return \Modules\Organization\Database\Factories\DivisionFactory::new();
    }
    protected $fillable = [
        'department_id',
        'name',
        'code',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    /**
     * Get the department that owns the division.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the positions for the division.
     */
    public function positions(): HasMany
    {
        return $this->hasMany(Position::class);
    }
}
