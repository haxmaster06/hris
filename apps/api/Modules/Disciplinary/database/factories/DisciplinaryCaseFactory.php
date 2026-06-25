<?php

declare(strict_types=1);

namespace Modules\Disciplinary\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Disciplinary\Models\DisciplinaryCase;
use Modules\Employee\Models\Employee;

class DisciplinaryCaseFactory extends Factory
{
    protected $model = DisciplinaryCase::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'case_number' => 'CASE/' . $this->faker->unique()->dateTimeThisYear()->format('Y/m') . '/' . $this->faker->unique()->numberBetween(1000, 9999),
            'category' => $this->faker->randomElement(['attendance', 'conduct', 'performance', 'policy_violation', 'other']),
            'incident_date' => $this->faker->dateTimeThisYear()->format('Y-m-d'),
            'description' => $this->faker->paragraph(),
            'evidence' => [],
            'severity' => $this->faker->randomElement(['minor', 'moderate', 'major', 'critical']),
            'status' => 'reported',
            'reported_by' => Employee::factory(),
            'version' => 1,
        ];
    }
}
