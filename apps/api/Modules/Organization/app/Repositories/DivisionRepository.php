<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\Division;
use Illuminate\Pagination\LengthAwarePaginator;

class DivisionRepository implements DivisionRepositoryInterface
{
    public function __construct(
        private readonly Division $model
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

        if (!empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): Division
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Division
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Division
    {
        $division = $this->findOrFail($id);
        $division->update($data);
        return $division->fresh();
    }

    public function delete(string $id): bool
    {
        $division = $this->findOrFail($id);
        return (bool) $division->delete();
    }
}
