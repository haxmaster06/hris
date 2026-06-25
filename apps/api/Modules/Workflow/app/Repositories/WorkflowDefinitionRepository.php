<?php

declare(strict_types=1);

namespace Modules\Workflow\Repositories;

use Modules\Workflow\Models\WorkflowDefinition;
use Illuminate\Pagination\LengthAwarePaginator;

class WorkflowDefinitionRepository implements WorkflowDefinitionRepositoryInterface
{
    public function __construct(
        private readonly WorkflowDefinition $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (!empty($filters['search'])) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }

        if (!empty($filters['module'])) {
            $query->where('module', $filters['module']);
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function findOrFail(string $id): WorkflowDefinition
    {
        return $this->model->findOrFail($id);
    }

    public function findByModuleAndEntity(string $module, string $entityType): ?WorkflowDefinition
    {
        return $this->model->where('module', $module)
            ->where('entity_type', $entityType)
            ->where('is_active', true)
            ->orderBy('version', 'desc')
            ->first();
    }

    public function create(array $data): WorkflowDefinition
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): WorkflowDefinition
    {
        $def = $this->findOrFail($id);
        $def->update($data);
        return $def->fresh();
    }

    public function delete(string $id): bool
    {
        $def = $this->findOrFail($id);
        return (bool) $def->delete();
    }
}
