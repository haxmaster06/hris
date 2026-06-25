<?php

declare(strict_types=1);

namespace Modules\Workflow\Repositories;

use Modules\Workflow\Models\WorkflowStep;
use Illuminate\Support\Collection;

interface WorkflowStepRepositoryInterface
{
    public function getStepsForDefinition(string $definitionId): Collection;
    public function findOrFail(string $id): WorkflowStep;
    public function create(array $data): WorkflowStep;
    public function update(string $id, array $data): WorkflowStep;
    public function delete(string $id): bool;
    public function reorder(string $definitionId, array $stepIds): void;
    public function findByDefinitionAndOrder(string $definitionId, int $order): ?WorkflowStep;
}
