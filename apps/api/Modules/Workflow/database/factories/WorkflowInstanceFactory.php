<?php

declare(strict_types=1);

namespace Modules\Workflow\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Workflow\Models\WorkflowInstance;
use Modules\Workflow\Models\WorkflowDefinition;
use App\Models\User;

class WorkflowInstanceFactory extends Factory
{
    protected $model = WorkflowInstance::class;

    public function definition(): array
    {
        return [
            'workflow_definition_id' => WorkflowDefinition::factory(),
            'entity_type' => 'Modules\\Leave\\Models\\LeaveRequest',
            'entity_id' => $this->faker->uuid(),
            'current_step_order' => 1,
            'status' => 'in_progress',
            'initiated_by' => User::factory(),
            'completed_at' => null,
            'version' => 1,
        ];
    }
}
