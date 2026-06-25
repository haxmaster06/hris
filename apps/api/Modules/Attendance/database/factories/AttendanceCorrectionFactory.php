<?php

declare(strict_types=1);

namespace Modules\Attendance\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Attendance\Models\AttendanceCorrection;
use Modules\Employee\Models\Employee;

class AttendanceCorrectionFactory extends Factory
{
    protected $model = AttendanceCorrection::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'original_check_in' => now()->subDay()->setTime(8, 0, 0),
            'original_check_out' => null,
            'corrected_check_in' => now()->subDay()->setTime(8, 0, 0),
            'corrected_check_out' => now()->subDay()->setTime(17, 0, 0),
            'reason' => $this->faker->sentence(),
            'status' => 'pending',
            'approved_by' => null,
            'version' => 1,
        ];
    }
}
