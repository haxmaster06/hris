<?php

declare(strict_types=1);

namespace Modules\Certification\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Organization\Models\Position;

class CertificationRequirement extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Certification\Database\Factories\CertificationRequirementFactory
    {
        return \Modules\Certification\Database\Factories\CertificationRequirementFactory::new();
    }

    protected $fillable = [
        'position_id',
        'certification_id',
        'is_mandatory',
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
    ];

    /**
     * Get the position associated with this requirement.
     */
    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    /**
     * Get the certification associated with this requirement.
     */
    public function certification(): BelongsTo
    {
        return $this->belongsTo(Certification::class);
    }
}
