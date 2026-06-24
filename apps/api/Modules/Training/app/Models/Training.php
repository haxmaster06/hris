<?php

declare(strict_types=1);

namespace Modules\Training\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Training extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Training\Database\Factories\TrainingFactory
    {
        return \Modules\Training\Database\Factories\TrainingFactory::new();
    }

    protected $fillable = [
        'name',
        'code',
        'category',
        'type',
        'description',
    ];

    /**
     * Get the sessions of the training.
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(TrainingSession::class);
    }
}
