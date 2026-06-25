<?php

declare(strict_types=1);

namespace Modules\Performance\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Performance\Models\ImprovementPlan;
use Modules\Performance\Models\PerformanceReview;
use Modules\Employee\Models\Employee;

class ImprovementPlanFactory extends Factory
{
    protected $model = ImprovementPlan::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'performance_review_id' => PerformanceReview::factory(),
            'title' => 'PIP - ' . $this->faker->words(3, true),
            'reason' => $this->faker->paragraph(),
            'action_items' => [
                [
                    'task' => 'Improve attendance rate',
                    'deadline' => $this->faker->dateTimeBetween('now', '+1 month')->format('Y-m-d'),
                    'status' => 'pending',
                ],
                [
                    'task' => 'Deliver tasks on time',
                    'deadline' => $this->faker->dateTimeBetween('+1 month', '+2 months')->format('Y-m-d'),
                    'status' => 'pending',
                ]
            ],
            'start_date' => $this->faker->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'end_date' => $this->faker->dateTimeBetween('now', '+3 months')->format('Y-m-d'),
            'status' => 'active',
            'supervisor_id' => Employee::factory(),
            'outcome_notes' => null,
            'version' => 1,
        ];
    }
}
