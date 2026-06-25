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
        'budget',
        'actual_cost',
        'vendor',
        'pre_test_score',
        'post_test_score',
        'effectiveness_rating',
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'actual_cost' => 'decimal:2',
        'pre_test_score' => 'decimal:2',
        'post_test_score' => 'decimal:2',
        'effectiveness_rating' => 'decimal:2',
    ];

    /**
     * Get the sessions of the training.
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(TrainingSession::class);
    }
}
