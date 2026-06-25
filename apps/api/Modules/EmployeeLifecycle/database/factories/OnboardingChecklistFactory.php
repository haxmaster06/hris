<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\EmployeeLifecycle\Models\OnboardingChecklist;
use Modules\Employee\Models\Employee;
use App\Models\User;

class OnboardingChecklistFactory extends Factory
{
    protected $model = OnboardingChecklist::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'category' => $this->faker->randomElement(['document', 'equipment', 'account', 'orientation', 'training']),
            'task_name' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'is_completed' => false,
            'assigned_to' => User::factory(),
            'due_date' => $this->faker->dateTimeBetween('now', '+2 weeks')->format('Y-m-d'),
            'sort_order' => 0,
        ];
    }
}
