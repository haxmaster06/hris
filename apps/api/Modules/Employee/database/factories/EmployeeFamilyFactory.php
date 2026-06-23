<?php

declare(strict_types=1);

namespace Modules\Employee\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Employee\Models\EmployeeFamily;
use Modules\Employee\Models\Employee;

class EmployeeFamilyFactory extends Factory
{
    protected $model = EmployeeFamily::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'name' => $this->faker->name(),
            'relationship' => $this->faker->randomElement(['spouse', 'child', 'parent']),
            'birth_date' => $this->faker->date('Y-m-d', '-30 years'),
        ];
    }
}
