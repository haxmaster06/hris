<?php

declare(strict_types=1);

namespace Modules\Employee\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Employee\Models\EmployeeEducation;
use Modules\Employee\Models\Employee;

class EmployeeEducationFactory extends Factory
{
    protected $model = EmployeeEducation::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'institution' => $this->faker->company() . ' University',
            'degree' => $this->faker->randomElement(['Bachelor', 'Master', 'Doctor']),
            'major' => $this->faker->randomElement(['Computer Science', 'Information Systems', 'Business Administration']),
            'graduation_year' => (int) $this->faker->year('-2 years'),
        ];
    }
}
