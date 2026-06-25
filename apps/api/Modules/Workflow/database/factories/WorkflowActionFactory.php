<?php

declare(strict_types=1);

namespace Modules\Workflow\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Workflow\Models\WorkflowAction;
use Modules\Workflow\Models\WorkflowInstance;
use Modules\Workflow\Models\WorkflowStep;
use App\Models\User;

class WorkflowActionFactory extends Factory
{
    protected $model = WorkflowAction::class;

    public function definition(): array
    {
        return [
            'workflow_instance_id' => WorkflowInstance::factory(),
            'workflow_step_id' => WorkflowStep::factory(),
            'step_order' => 1,
            'actor_id' => User::factory(),
            'action' => 'approve',
            'comment' => $this->faker->sentence(),
            'acted_at' => now(),
        ];
    }
}
