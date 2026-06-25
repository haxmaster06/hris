<?php

declare(strict_types=1);

namespace Modules\Engagement\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurveyAnswer extends BaseModel
{
    use HasFactory;

    protected $table = 'survey_answers';

    protected static function newFactory(): \Modules\Engagement\Database\Factories\SurveyAnswerFactory
    {
        return \Modules\Engagement\Database\Factories\SurveyAnswerFactory::new();
    }

    protected $fillable = [
        'survey_response_id',
        'survey_question_id',
        'answer_text',
        'answer_choices',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'answer_choices' => 'json',
        'version' => 'integer',
    ];

    public function surveyResponse(): BelongsTo
    {
        return $this->belongsTo(SurveyResponse::class, 'survey_response_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(SurveyQuestion::class, 'survey_question_id');
    }
}
