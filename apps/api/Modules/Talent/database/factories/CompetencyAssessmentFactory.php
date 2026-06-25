<?php

declare(strict_types=1);

namespace Modules\Talent\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Talent\Models\CompetencyAssessment;
use Modules\Employee\Models\Employee;

class CompetencyAssessmentFactory extends Factory
{
    protected $model = CompetencyAssessment::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'assessor_id' => Employee::factory(),
            'assessment_date' => $this->faker->dateTimeThisYear()->format('Y-m-d'),
            'status' => 'pending',
            'overall_score' => $this->faker->randomFloat(2, 50, 100),
            'notes' => $this->faker->sentence(),
            'version' => 1,
        ];
    }
}
