<?php

declare(strict_types=1);

namespace Modules\Attendance\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Attendance\Models\OvertimeRequest;
use Modules\Employee\Models\Employee;

class OvertimeRequestFactory extends Factory
{
    protected $model = OvertimeRequest::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'date' => now()->toDateString(),
            'planned_hours' => 2.0,
            'actual_hours' => null,
            'reason' => $this->faker->sentence(),
            'status' => 'pending',
            'approved_by' => null,
            'version' => 1,
        ];
    }
}
