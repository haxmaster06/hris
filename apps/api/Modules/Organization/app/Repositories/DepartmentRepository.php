<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\Department;
use Illuminate\Pagination\LengthAwarePaginator;

class DepartmentRepository implements DepartmentRepositoryInterface
{
    public function __construct(
        private readonly Department $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'ilike', "%{$filters['search']}%")
                  ->orWhere('code', 'ilike', "%{$filters['search']}%");
            });
        }

        if (!empty($filters['branch_id'])) {
            $query->where('branch_id', $filters['branch_id']);
        }

        if (array_key_exists('parent_id', $filters)) {
            $query->where('parent_id', $filters['parent_id']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function find(string $id): ?Department
    {
        return $this->model->find($id);
    }

    public function findOrFail(string $id): Department
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Department
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Department
    {
        $department = $this->findOrFail($id);
        $department->update($data);
        return $department->fresh();
    }

    public function delete(string $id): bool
    {
        $department = $this->findOrFail($id);
        return (bool) $department->delete();
    }
}
