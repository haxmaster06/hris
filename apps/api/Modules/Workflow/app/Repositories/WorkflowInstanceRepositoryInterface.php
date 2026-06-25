<?php

declare(strict_types=1);

namespace Modules\Workflow\Repositories;

use Modules\Workflow\Models\WorkflowInstance;
use Illuminate\Pagination\LengthAwarePaginator;

interface WorkflowInstanceRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): WorkflowInstance;
    public function findActiveForEntity(string $entityType, string $entityId): ?WorkflowInstance;
    public function create(array $data): WorkflowInstance;
    public function update(string $id, array $data): WorkflowInstance;
    public function delete(string $id): bool;
}
