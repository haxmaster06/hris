<?php

declare(strict_types=1);

namespace Modules\Training\Repositories;

use Modules\Training\Models\Training;
use Illuminate\Pagination\LengthAwarePaginator;

class TrainingRepository implements TrainingRepositoryInterface
{
    public function __construct(
        private readonly Training $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (!empty($filters['search'])) {
            $query->where('name', 'ilike', "%{$filters['search']}%")
                  ->orWhere('code', 'ilike', "%{$filters['search']}%");
        }

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): Training
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Training
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Training
    {
        $training = $this->findOrFail($id);
        $training->update($data);
        return $training->fresh();
    }

    public function delete(string $id): bool
    {
        $training = $this->findOrFail($id);
        return (bool) $training->delete();
    }
}
