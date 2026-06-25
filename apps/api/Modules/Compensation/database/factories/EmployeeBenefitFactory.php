<?php

declare(strict_types=1);

namespace Modules\Compensation\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Compensation\Models\EmployeeBenefit;
use Modules\Compensation\Models\Benefit;
use Modules\Employee\Models\Employee;

class EmployeeBenefitFactory extends Factory
{
    protected $model = EmployeeBenefit::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'benefit_id' => Benefit::factory(),
            'start_date' => now()->subMonths(2)->toDateString(),
            'end_date' => null,
            'status' => 'active',
            'version' => 1,
        ];
    }
}
