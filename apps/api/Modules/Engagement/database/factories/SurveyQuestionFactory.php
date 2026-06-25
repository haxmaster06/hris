<?php

declare(strict_types=1);

namespace Modules\Engagement\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Engagement\Models\Survey;
use Modules\Engagement\Models\SurveyQuestion;

class SurveyQuestionFactory extends Factory
{
    protected $model = SurveyQuestion::class;

    public function definition(): array
    {
        return [
            'survey_id' => Survey::factory(),
            'question' => $this->faker->sentence(8) . '?',
            'type' => $this->faker->randomElement(['scale_1_5', 'scale_1_10', 'text', 'single_choice', 'multiple_choice']),
            'options' => ['Sangat Baik', 'Baik', 'Cukup', 'Kurang'],
            'is_required' => true,
            'sort_order' => $this->faker->numberBetween(0, 10),
            'version' => 1,
        ];
    }
}
