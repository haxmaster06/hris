<?php

declare(strict_types=1);

namespace Modules\Workflow\Repositories;

use Modules\Workflow\Models\WorkflowAction;
use Illuminate\Support\Collection;

class WorkflowActionRepository implements WorkflowActionRepositoryInterface
{
    public function __construct(
        private readonly WorkflowAction $model
    ) {}

    public function getActionsForInstance(string $instanceId): Collection
    {
        return $this->model->where('workflow_instance_id', $instanceId)
            ->orderBy('step_order')
            ->orderBy('acted_at')
            ->get();
    }

    public function create(array $data): WorkflowAction
    {
        return $this->model->create($data);
    }
}
