<?php

declare(strict_types=1);

namespace Modules\Payroll\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Payroll\Models\EmployeeSalary;
use Modules\Employee\Models\Employee;

class EmployeeSalaryFactory extends Factory
{
    protected $model = EmployeeSalary::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'basic_salary' => $this->faker->randomFloat(2, 4000000, 20000000),
            'tax_method' => $this->faker->randomElement(['gross', 'nett', 'gross_up']),
            'tax_status' => $this->faker->randomElement(['TK/0', 'TK/1', 'K/0', 'K/1', 'K/2']),
            'bpjs_class' => $this->faker->randomElement(['1', '2', '3']),
            'bank_name' => $this->faker->randomElement(['BCA', 'Mandiri', 'BRI', 'BNI']),
            'bank_account' => $this->faker->numerify('##########'),
            'bank_holder_name' => $this->faker->name(),
            'effective_date' => now()->subMonths(1)->toDateString(),
            'notes' => $this->faker->sentence(),
            'version' => 1,
        ];
    }
}
