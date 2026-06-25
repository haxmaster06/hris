<?php

declare(strict_types=1);

namespace Modules\Engagement\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SurveyQuestion extends BaseModel
{
    use HasFactory;

    protected $table = 'survey_questions';

    protected static function newFactory(): \Modules\Engagement\Database\Factories\SurveyQuestionFactory
    {
        return \Modules\Engagement\Database\Factories\SurveyQuestionFactory::new();
    }

    protected $fillable = [
        'survey_id',
        'question',
        'type',
        'options',
        'is_required',
        'sort_order',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'options' => 'json',
        'is_required' => 'boolean',
        'sort_order' => 'integer',
        'version' => 'integer',
    ];

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class, 'survey_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(SurveyAnswer::class, 'survey_question_id');
    }
}
