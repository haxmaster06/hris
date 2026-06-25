<?php

declare(strict_types=1);

namespace Modules\Engagement\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Engagement\Models\Survey;
use Modules\Engagement\Models\SurveyResponse;
use Modules\Employee\Models\Employee;

class SurveyResponseFactory extends Factory
{
    protected $model = SurveyResponse::class;

    public function definition(): array
    {
        return [
            'survey_id' => Survey::factory(),
            'employee_id' => Employee::factory(),
            'submitted_at' => now(),
            'version' => 1,
        ];
    }
}
