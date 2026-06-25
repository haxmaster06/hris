<?php

declare(strict_types=1);

namespace Modules\Performance\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Performance\Models\PerformancePeriod;

class PerformancePeriodFactory extends Factory
{
    protected $model = PerformancePeriod::class;

    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('-1 year', 'now');
        $endDate = (clone $startDate)->modify('+3 months');

        return [
            'name' => 'Q' . $this->faker->numberBetween(1, 4) . ' ' . $startDate->format('Y'),
            'type' => 'quarterly',
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'status' => 'draft',
            'version' => 1,
        ];
    }
}
