<?php

declare(strict_types=1);

namespace Modules\Talent\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Talent\Models\SuccessionPlan;
use Modules\Organization\Models\Position;
use Modules\Employee\Models\Employee;

class SuccessionPlanFactory extends Factory
{
    protected $model = SuccessionPlan::class;

    public function definition(): array
    {
        return [
            'position_id' => Position::factory(),
            'incumbent_employee_id' => Employee::factory(),
            'candidate_employee_id' => Employee::factory(),
            'readiness_level' => $this->faker->randomElement(['ready_now', 'ready_1_year', 'ready_2_years', 'development_needed']),
            'potential_score' => $this->faker->randomFloat(2, 40, 100),
            'performance_score' => $this->faker->randomFloat(2, 40, 100),
            'development_actions' => [],
            'notes' => $this->faker->sentence(),
            'version' => 1,
        ];
    }
}
