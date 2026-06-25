<?php

declare(strict_types=1);

namespace Modules\Payroll\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Payroll\Models\EmployeeAllowance;
use Modules\Payroll\Models\PayrollComponent;
use Modules\Employee\Models\Employee;

class EmployeeAllowanceFactory extends Factory
{
    protected $model = EmployeeAllowance::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'payroll_component_id' => PayrollComponent::factory(),
            'amount' => $this->faker->randomFloat(2, 200000, 2000000),
            'effective_date' => now()->subMonths(1)->toDateString(),
            'end_date' => null,
            'is_active' => true,
            'version' => 1,
        ];
    }
}
