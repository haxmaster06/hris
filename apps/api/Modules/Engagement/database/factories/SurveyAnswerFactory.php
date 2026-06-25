<?php

declare(strict_types=1);

namespace Modules\Engagement\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Engagement\Models\SurveyResponse;
use Modules\Engagement\Models\SurveyQuestion;
use Modules\Engagement\Models\SurveyAnswer;

class SurveyAnswerFactory extends Factory
{
    protected $model = SurveyAnswer::class;

    public function definition(): array
    {
        return [
            'survey_response_id' => SurveyResponse::factory(),
            'survey_question_id' => SurveyQuestion::factory(),
            'answer_text' => $this->faker->sentence(),
            'answer_choices' => null,
            'version' => 1,
        ];
    }
}
