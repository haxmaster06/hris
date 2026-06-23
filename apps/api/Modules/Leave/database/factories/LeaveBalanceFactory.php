<?php

declare(strict_types=1);

namespace Modules\Leave\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Leave\Models\LeaveBalance;
use Modules\Leave\Models\LeaveType;
use Modules\Employee\Models\Employee;

class LeaveBalanceFactory extends Factory
{
    protected $model = LeaveBalance::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'leave_type_id' => LeaveType::factory(),
            'year' => (int) date('Y'),
            'entitled' => 12,
            'used' => 0,
            'pending' => 0,
            'remaining' => 12,
        ];
    }
}
