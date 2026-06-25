<?php

declare(strict_types=1);

namespace Modules\Payroll\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Payroll\Models\EmployeeLoan;
use Modules\Employee\Models\Employee;

class EmployeeLoanFactory extends Factory
{
    protected $model = EmployeeLoan::class;

    public function definition(): array
    {
        $principal = $this->faker->randomFloat(2, 1000000, 10000000);
        $installments = $this->faker->randomElement([5, 10, 12]);
        $inst_amount = $principal / $installments;

        return [
            'employee_id' => Employee::factory(),
            'loan_number' => 'LOAN-' . $this->faker->unique()->numberBetween(10000, 99999),
            'principal_amount' => $principal,
            'remaining_amount' => $principal,
            'installment_amount' => $inst_amount,
            'total_installments' => $installments,
            'paid_installments' => 0,
            'start_date' => now()->toDateString(),
            'end_date' => null,
            'status' => 'active',
            'reason' => $this->faker->sentence(),
            'approved_by' => null,
            'version' => 1,
        ];
    }
}
