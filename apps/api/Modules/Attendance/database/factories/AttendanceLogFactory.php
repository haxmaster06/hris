<?php

declare(strict_types=1);

namespace Modules\Attendance\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Attendance\Models\AttendanceLog;
use Modules\Employee\Models\Employee;

class AttendanceLogFactory extends Factory
{
    protected $model = AttendanceLog::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'date' => now()->toDateString(),
            'check_in' => '08:00:00',
            'check_out' => '17:00:00',
            'check_in_ip' => '127.0.0.1',
            'check_out_ip' => '127.0.0.1',
            'status' => 'present',
            'work_hours' => 9.00,
        ];
    }
}
