<?php

declare(strict_types=1);

namespace Modules\Performance\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Performance\Models\KPIAssignment;
use Modules\Performance\Models\KPI;
use Modules\Employee\Models\Employee;
use Modules\Performance\Models\PerformancePeriod;

class KPIAssignmentFactory extends Factory
{
    protected $model = KPIAssignment::class;

    public function definition(): array
    {
        $target = $this->faker->randomFloat(2, 50, 100);
        $actual = $this->faker->randomFloat(2, 40, 110);
        $weight = $this->faker->randomFloat(2, 10, 40);

        return [
            'kpi_id' => KPI::factory(),
            'employee_id' => Employee::factory(),
            'performance_period_id' => PerformancePeriod::factory(),
            'target_value' => $target,
            'actual_value' => $actual,
            'weight' => $weight,
            'score' => $this->faker->randomFloat(2, 0, 100),
            'notes' => $this->faker->sentence(),
            'version' => 1,
        ];
    }
}
