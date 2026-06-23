<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\Branch;
use Illuminate\Pagination\LengthAwarePaginator;

class BranchRepository implements BranchRepositoryInterface
{
    public function __construct(
        private readonly Branch $model
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

        if (!empty($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): Branch
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Branch
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Branch
    {
        $branch = $this->findOrFail($id);
        $branch->update($data);
        return $branch->fresh();
    }

    public function delete(string $id): bool
    {
        $branch = $this->findOrFail($id);
        return (bool) $branch->delete();
    }
}
