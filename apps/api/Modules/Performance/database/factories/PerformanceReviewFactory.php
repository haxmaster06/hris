<?php

declare(strict_types=1);

namespace Modules\Performance\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Performance\Models\PerformanceReview;
use Modules\Performance\Models\PerformancePeriod;
use Modules\Employee\Models\Employee;

class PerformanceReviewFactory extends Factory
{
    protected $model = PerformanceReview::class;

    public function definition(): array
    {
        return [
            'performance_period_id' => PerformancePeriod::factory(),
            'employee_id' => Employee::factory(),
            'kpi_score' => $this->faker->randomFloat(2, 60, 100),
            'self_score' => $this->faker->randomFloat(2, 60, 100),
            'self_comment' => $this->faker->sentence(),
            'manager_score' => $this->faker->randomFloat(2, 60, 100),
            'manager_comment' => $this->faker->sentence(),
            'manager_id' => Employee::factory(),
            'hr_score' => $this->faker->randomFloat(2, 60, 100),
            'hr_comment' => $this->faker->sentence(),
            'hr_reviewer_id' => Employee::factory(),
            'final_score' => $this->faker->randomFloat(2, 60, 100),
            'rating' => $this->faker->randomElement(['exceptional', 'exceeds', 'meets', 'below', 'unsatisfactory']),
            'status' => 'pending',
            'version' => 1,
        ];
    }
}
