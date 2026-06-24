<?php

declare(strict_types=1);

namespace Modules\Recruitment\Repositories;

use Modules\Recruitment\Models\Candidate;
use Illuminate\Pagination\LengthAwarePaginator;

class CandidateRepository implements CandidateRepositoryInterface
{
    public function __construct(
        private readonly Candidate $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('first_name', 'ilike', "%{$filters['search']}%")
                  ->orWhere('last_name', 'ilike', "%{$filters['search']}%")
                  ->orWhere('email', 'ilike', "%{$filters['search']}%");
            });
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): Candidate
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Candidate
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Candidate
    {
        $candidate = $this->findOrFail($id);
        $candidate->update($data);
        return $candidate->fresh();
    }

    public function delete(string $id): bool
    {
        $candidate = $this->findOrFail($id);
        return (bool) $candidate->delete();
    }
}
