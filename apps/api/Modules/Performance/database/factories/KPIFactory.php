<?php

declare(strict_types=1);

namespace Modules\Performance\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Performance\Models\KPI;

class KPIFactory extends Factory
{
    protected $model = KPI::class;

    public function definition(): array
    {
        return [
            'code' => 'KPI-' . $this->faker->unique()->bothify('###??'),
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->sentence(),
            'category' => $this->faker->randomElement(['financial', 'customer', 'process', 'learning']),
            'unit' => $this->faker->randomElement(['percentage', 'number', 'currency', 'boolean']),
            'measurement_type' => $this->faker->randomElement(['higher_better', 'lower_better', 'target_exact']),
            'position_id' => null,
            'is_active' => true,
            'version' => 1,
        ];
    }
}
