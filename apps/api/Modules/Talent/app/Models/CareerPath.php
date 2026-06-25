<?php

declare(strict_types=1);

namespace Modules\Talent\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CareerPath extends BaseModel
{
    use HasFactory;

    protected $table = 'career_paths';

    protected static function newFactory(): \Modules\Talent\Database\Factories\CareerPathFactory
    {
        return \Modules\Talent\Database\Factories\CareerPathFactory::new();
    }

    protected $fillable = [
        'from_position_id',
        'to_position_id',
        'path_type',
        'typical_years',
        'requirements',
        'description',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'requirements' => 'array',
        'typical_years' => 'integer',
        'version' => 'integer',
    ];

    public function fromPosition(): BelongsTo
    {
        return $this->belongsTo(\Modules\Organization\Models\Position::class, 'from_position_id');
    }

    public function toPosition(): BelongsTo
    {
        return $this->belongsTo(\Modules\Organization\Models\Position::class, 'to_position_id');
    }
}
