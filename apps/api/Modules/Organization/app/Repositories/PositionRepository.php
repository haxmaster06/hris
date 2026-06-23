<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\Position;
use Illuminate\Pagination\LengthAwarePaginator;

class PositionRepository implements PositionRepositoryInterface
{
    public function __construct(
        private readonly Position $model
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

        if (!empty($filters['division_id'])) {
            $query->where('division_id', $filters['division_id']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): Position
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Position
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Position
    {
        $position = $this->findOrFail($id);
        $position->update($data);
        return $position->fresh();
    }

    public function delete(string $id): bool
    {
        $position = $this->findOrFail($id);
        return (bool) $position->delete();
    }
}
