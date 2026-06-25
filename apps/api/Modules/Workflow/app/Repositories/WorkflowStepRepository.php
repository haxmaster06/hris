<?php

declare(strict_types=1);

namespace Modules\Workflow\Repositories;

use Modules\Workflow\Models\WorkflowStep;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class WorkflowStepRepository implements WorkflowStepRepositoryInterface
{
    public function __construct(
        private readonly WorkflowStep $model
    ) {}

    public function getStepsForDefinition(string $definitionId): Collection
    {
        return $this->model->where('workflow_definition_id', $definitionId)
            ->orderBy('step_order')
            ->get();
    }

    public function findOrFail(string $id): WorkflowStep
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): WorkflowStep
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): WorkflowStep
    {
        $step = $this->findOrFail($id);
        $step->update($data);
        return $step->fresh();
    }

    public function delete(string $id): bool
    {
        $step = $this->findOrFail($id);
        return (bool) $step->delete();
    }

    public function reorder(string $definitionId, array $stepIds): void
    {
        DB::transaction(function () use ($stepIds) {
            foreach ($stepIds as $index => $id) {
                $this->model->where('id', $id)->update(['step_order' => $index + 1]);
            }
        });
    }

    public function findByDefinitionAndOrder(string $definitionId, int $order): ?WorkflowStep
    {
        return $this->model->where('workflow_definition_id', $definitionId)
            ->where('step_order', $order)
            ->first();
    }
}
