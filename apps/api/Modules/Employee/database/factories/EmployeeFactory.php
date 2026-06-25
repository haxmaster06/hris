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
            'division_id' => null,
            'position_id' => Position::factory(),
            'grade_id' => null,
            'reports_to' => null,
            'employee_number' => 'EMP-' . $this->faker->unique()->numerify('######'),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'gender' => $this->faker->randomElement(['male', 'female']),
            'birth_date' => $this->faker->date('Y-m-d', '-22 years'),
            'join_date' => $this->faker->date('Y-m-d', '-2 years'),
            'end_date' => null,
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->unique()->safeEmail(),
            'id_number' => $this->faker->numerify('################'),
            'tax_number' => $this->faker->numerify('###############'),
            'blood_type' => $this->faker->randomElement(['A', 'B', 'AB', 'O']),
            'religion' => $this->faker->randomElement(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']),
            'marital_status' => $this->faker->randomElement(['single', 'married', 'widowed', 'divorced']),
            'address' => $this->faker->address(),
            'city' => $this->faker->city(),
            'province' => $this->faker->state(),
            'postal_code' => $this->faker->postcode(),
            'status' => 'probation',
            'employment_type' => $this->faker->randomElement(['permanent', 'contract', 'internship', 'outsource']),
            'photo_url' => $this->faker->imageUrl(),
        ];
    }
}
