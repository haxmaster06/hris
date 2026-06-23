<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\Grade;
use Illuminate\Pagination\LengthAwarePaginator;

class GradeRepository implements GradeRepositoryInterface
{
    public function __construct(
        private readonly Grade $model
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

        if (isset($filters['level'])) {
            $query->where('level', $filters['level']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): Grade
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Grade
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Grade
    {
        $grade = $this->findOrFail($id);
        $grade->update($data);
        return $grade->fresh();
    }

    public function delete(string $id): bool
    {
        $grade = $this->findOrFail($id);
        return (bool) $grade->delete();
    }
}
