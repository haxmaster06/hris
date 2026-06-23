<?php

declare(strict_types=1);

namespace Modules\Attendance\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Attendance\Models\EmployeeShift;
use Modules\Attendance\Models\Shift;
use Modules\Employee\Models\Employee;

class EmployeeShiftFactory extends Factory
{
    protected $model = EmployeeShift::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'shift_id' => Shift::factory(),
            'start_date' => now()->toDateString(),
            'end_date' => null,
        ];
    }
}
