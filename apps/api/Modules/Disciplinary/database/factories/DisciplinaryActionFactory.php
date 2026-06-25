<?php

declare(strict_types=1);

namespace Modules\Disciplinary\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Disciplinary\Models\DisciplinaryAction;
use Modules\Disciplinary\Models\DisciplinaryCase;
use Modules\Employee\Models\Employee;

class DisciplinaryActionFactory extends Factory
{
    protected $model = DisciplinaryAction::class;

    public function definition(): array
    {
        return [
            'disciplinary_case_id' => DisciplinaryCase::factory(),
            'action_type' => $this->faker->randomElement(['verbal_warning', 'sp1', 'sp2', 'sp3', 'suspension', 'termination']),
            'effective_date' => $this->faker->dateTimeThisYear()->format('Y-m-d'),
            'expiry_date' => $this->faker->dateTimeThisYear()->modify('+6 months')->format('Y-m-d'),
            'description' => $this->faker->sentence(),
            'issued_by' => Employee::factory(),
            'document_path' => null,
            'acknowledged_by' => null,
            'acknowledged_at' => null,
            'version' => 1,
        ];
    }
}
