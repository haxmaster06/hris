<?php

declare(strict_types=1);

namespace Modules\Employee\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Employee\Models\EmployeeExperience;
use Modules\Employee\Models\Employee;

class EmployeeExperienceFactory extends Factory
{
    protected $model = EmployeeExperience::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        $startDate = $this->faker->date('Y-m-d', '-5 years');
        $endDate = $this->faker->date('Y-m-d', '-2 years');

        return [
            'employee_id' => Employee::factory(),
            'company_name' => $this->faker->company(),
            'position' => $this->faker->jobTitle(),
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];
    }
}
