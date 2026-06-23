<?php

declare(strict_types=1);

namespace Modules\Organization\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Organization\Models\Grade;

class GradeFactory extends Factory
{
    protected $model = Grade::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        $min = $this->faker->numberBetween(5000000, 15000000);
        $max = $min + $this->faker->numberBetween(5000000, 20000000);

        return [
            'name' => 'Grade ' . $this->faker->word(),
            'code' => strtoupper($this->faker->unique()->lexify('GRD???')),
            'level' => $this->faker->numberBetween(1, 15),
            'min_salary' => $min,
            'max_salary' => $max,
        ];
    }
}
