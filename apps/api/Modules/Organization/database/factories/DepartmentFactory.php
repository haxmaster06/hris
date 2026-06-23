<?php

declare(strict_types=1);

namespace Modules\Organization\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Branch;

class DepartmentFactory extends Factory
{
    protected $model = Department::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'parent_id' => null,
            'name' => $this->faker->jobTitle() . ' Department',
            'code' => strtoupper($this->faker->unique()->lexify('DEP???')),
        ];
    }
}
