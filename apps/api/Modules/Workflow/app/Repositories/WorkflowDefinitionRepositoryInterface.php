<?php

declare(strict_types=1);

namespace Modules\Workflow\Repositories;

use Modules\Workflow\Models\WorkflowDefinition;
use Illuminate\Pagination\LengthAwarePaginator;

interface WorkflowDefinitionRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): WorkflowDefinition;
    public function findByModuleAndEntity(string $module, string $entityType): ?WorkflowDefinition;
    public function create(array $data): WorkflowDefinition;
    public function update(string $id, array $data): WorkflowDefinition;
    public function delete(string $id): bool;
}
