<?php

declare(strict_types=1);

namespace Modules\Employee\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Employee\Models\EmployeeHistory;
use Modules\Employee\Models\Employee;

class EmployeeHistoryFactory extends Factory
{
    protected $model = EmployeeHistory::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'type' => 'status_change',
            'field' => 'status',
            'old_value' => 'probation',
            'new_value' => 'permanent',
            'effective_date' => now()->toDateString(),
        ];
    }
}
