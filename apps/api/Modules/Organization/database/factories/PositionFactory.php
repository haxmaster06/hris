<?php

declare(strict_types=1);

namespace Modules\Organization\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Organization\Models\Position;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Division;

class PositionFactory extends Factory
{
    protected $model = Position::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'department_id' => Department::factory(),
            'division_id' => function (array $attributes) {
                return Division::factory()->create([
                    'department_id' => $attributes['department_id'],
                ])->id;
            },
            'name' => $this->faker->jobTitle(),
            'code' => strtoupper($this->faker->unique()->lexify('POS???')),
            'job_description' => $this->faker->paragraph(),
        ];
    }
}
