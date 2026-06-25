<?php

declare(strict_types=1);

namespace Modules\Engagement\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Survey extends BaseModel
{
    use HasFactory;

    protected $table = 'surveys';

    protected static function newFactory(): \Modules\Engagement\Database\Factories\SurveyFactory
    {
        return \Modules\Engagement\Database\Factories\SurveyFactory::new();
    }

    protected $fillable = [
        'title',
        'description',
        'type',
        'status',
        'start_date',
        'end_date',
        'is_anonymous',
        'target_audience',
        'target_ids',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'is_anonymous' => 'boolean',
        'target_ids' => 'json',
        'start_date' => 'date',
        'end_date' => 'date',
        'version' => 'integer',
    ];

    public function questions(): HasMany
    {
        return $this->hasMany(SurveyQuestion::class, 'survey_id')->orderBy('sort_order');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(SurveyResponse::class, 'survey_id');
    }
}
