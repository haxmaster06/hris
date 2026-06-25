<?php

declare(strict_types=1);

namespace Modules\Workflow\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Workflow\Models\WorkflowStep;
use Modules\Workflow\Models\WorkflowDefinition;

class WorkflowStepFactory extends Factory
{
    protected $model = WorkflowStep::class;

    public function definition(): array
    {
        return [
            'workflow_definition_id' => WorkflowDefinition::factory(),
            'step_order' => 1,
            'name' => 'Review Manager',
            'approver_type' => 'specific_user',
            'approver_role_id' => null,
            'approver_user_id' => null,
            'condition_expression' => null,
            'is_optional' => false,
            'sla_hours' => 24,
            'on_timeout' => 'escalate',
        ];
    }
}
