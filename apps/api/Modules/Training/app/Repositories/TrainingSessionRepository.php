<?php

declare(strict_types=1);

namespace Modules\Training\Repositories;

use Modules\Training\Models\TrainingSession;
use Illuminate\Pagination\LengthAwarePaginator;

class TrainingSessionRepository implements TrainingSessionRepositoryInterface
{
    public function __construct(
        private readonly TrainingSession $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        // Eager load relations
        $query->with(['training']);

        if (!empty($filters['search'])) {
            $query->whereHas('training', function ($q) use ($filters) {
                $q->where('name', 'ilike', "%{$filters['search']}%");
            })->orWhere('trainer', 'ilike', "%{$filters['search']}%")
              ->orWhere('venue', 'ilike', "%{$filters['search']}%");
        }

        if (!empty($filters['training_id'])) {
            $query->where('training_id', $filters['training_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['upcoming'])) {
            $query->where('start_date', '>=', now());
        }

        $sortBy = $filters['sort_by'] ?? 'start_date';
        $sortDir = $filters['sort_dir'] ?? 'asc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): TrainingSession
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): TrainingSession
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): TrainingSession
    {
        $session = $this->findOrFail($id);
        $session->update($data);
        return $session->fresh();
    }

    public function delete(string $id): bool
    {
        $session = $this->findOrFail($id);
        return (bool) $session->delete();
    }
}
