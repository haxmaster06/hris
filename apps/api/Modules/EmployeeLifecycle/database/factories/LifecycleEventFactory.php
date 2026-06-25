<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\EmployeeLifecycle\Models\LifecycleEvent;
use Modules\Employee\Models\Employee;
use Modules\Organization\Models\Position;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Branch;

class LifecycleEventFactory extends Factory
{
    protected $model = LifecycleEvent::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'event_type' => $this->faker->randomElement(['promotion', 'mutation', 'demotion']),
            'effective_date' => $this->faker->dateTimeBetween('now', '+1 month')->format('Y-m-d'),
            
            'from_position_id' => Position::factory(),
            'to_position_id' => Position::factory(),
            'from_department_id' => Department::factory(),
            'to_department_id' => Department::factory(),
            'from_branch_id' => Branch::factory(),
            'to_branch_id' => Branch::factory(),
            
            'from_status' => 'probation',
            'to_status' => 'permanent',
            
            'from_salary' => 5000000.00,
            'to_salary' => 7000000.00,
            
            'reason' => $this->faker->sentence(),
            'notes' => $this->faker->paragraph(),
            'status' => 'draft',
        ];
    }
}
