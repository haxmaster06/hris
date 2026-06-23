<?php

declare(strict_types=1);

namespace Modules\Organization\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Organization\Models\Division;
use Modules\Organization\Models\Department;

class DivisionFactory extends Factory
{
    protected $model = Division::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'department_id' => Department::factory(),
            'name' => $this->faker->word() . ' Division',
            'code' => strtoupper($this->faker->unique()->lexify('DIV???')),
        ];
    }
}
