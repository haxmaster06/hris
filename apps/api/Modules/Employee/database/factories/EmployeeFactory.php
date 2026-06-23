<?php

declare(strict_types=1);

namespace Modules\Employee\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Employee\Models\Employee;
use Modules\Organization\Models\Company;
use Modules\Organization\Models\Branch;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Position;
use App\Models\User;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'company_id' => Company::factory(),
            'branch_id' => Branch::factory(),
            'department_id' => Department::factory(),
            'position_id' => Position::factory(),
            'employee_number' => 'EMP-' . $this->faker->unique()->numerify('######'),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'gender' => $this->faker->randomElement(['male', 'female']),
            'birth_date' => $this->faker->date('Y-m-d', '-22 years'),
            'join_date' => $this->faker->date('Y-m-d', '-2 years'),
            'status' => 'probation',
        ];
    }
}
