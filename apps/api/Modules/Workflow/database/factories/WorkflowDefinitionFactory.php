<?php

declare(strict_types=1);

namespace Modules\Workflow\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Workflow\Models\WorkflowDefinition;

class WorkflowDefinitionFactory extends Factory
{
    protected $model = WorkflowDefinition::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true) . ' Approval',
            'module' => $this->faker->randomElement(['leave', 'payroll', 'claim']),
            'entity_type' => 'Modules\\Leave\\Models\\LeaveRequest',
            'description' => $this->faker->sentence(),
            'is_active' => true,
            'version' => 1,
        ];
    }
}
