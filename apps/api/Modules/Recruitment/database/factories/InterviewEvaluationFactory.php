<?php

declare(strict_types=1);

namespace Modules\Recruitment\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Recruitment\Models\Interview;
use Modules\Recruitment\Models\InterviewEvaluation;
use Modules\Employee\Models\Employee;

class InterviewEvaluationFactory extends Factory
{
    protected $model = InterviewEvaluation::class;

    public function definition(): array
    {
        return [
            'interview_id' => Interview::factory(),
            'evaluator_id' => Employee::factory(),
            'criteria' => [
                'communication' => $this->faker->numberBetween(1, 5),
                'technical' => $this->faker->numberBetween(1, 5),
                'culture_fit' => $this->faker->numberBetween(1, 5),
            ],
            'overall_score' => $this->faker->randomFloat(2, 1, 5),
            'recommendation' => $this->faker->randomElement(['hire', 'reject', 'hold']),
            'comments' => $this->faker->paragraph(),
            'version' => 1,
        ];
    }
}
