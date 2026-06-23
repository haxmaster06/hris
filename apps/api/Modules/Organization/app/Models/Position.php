<?php

declare(strict_types=1);

namespace Modules\Organization\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Position extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Organization\Database\Factories\PositionFactory
    {
        return \Modules\Organization\Database\Factories\PositionFactory::new();
    }
    protected $fillable = [
        'department_id',
        'division_id',
        'name',
        'code',
        'job_description',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    /**
     * Get the department for the position.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the division for the position.
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }
}
