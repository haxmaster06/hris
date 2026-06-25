<?php

declare(strict_types=1);

namespace Modules\Disciplinary\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Disciplinary\Models\Investigation;
use Modules\Disciplinary\Models\DisciplinaryCase;
use Modules\Employee\Models\Employee;

class InvestigationFactory extends Factory
{
    protected $model = Investigation::class;

    public function definition(): array
    {
        return [
            'disciplinary_case_id' => DisciplinaryCase::factory(),
            'investigator_id' => Employee::factory(),
            'findings' => $this->faker->paragraph(),
            'recommendation' => $this->faker->sentence(),
            'committee_notes' => $this->faker->sentence(),
            'status' => 'in_progress',
            'completed_at' => null,
            'version' => 1,
        ];
    }
}
