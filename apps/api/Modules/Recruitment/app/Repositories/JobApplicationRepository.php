<?php

declare(strict_types=1);

namespace Modules\Recruitment\Repositories;

use Modules\Recruitment\Models\JobApplication;
use Illuminate\Pagination\LengthAwarePaginator;

class JobApplicationRepository implements JobApplicationRepositoryInterface
{
    public function __construct(
        private readonly JobApplication $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        // Eager load relations
        $query->with(['vacancy.position', 'vacancy.company', 'vacancy.department', 'candidate', 'interviews', 'approvals']);

        if (!empty($filters['vacancy_id'])) {
            $query->where('vacancy_id', $filters['vacancy_id']);
        }

        if (!empty($filters['candidate_id'])) {
            $query->where('candidate_id', $filters['candidate_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $query->whereHas('candidate', function ($q) use ($filters) {
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

    public function findOrFail(string $id): JobApplication
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): JobApplication
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): JobApplication
    {
        $application = $this->findOrFail($id);
        $application->update($data);
        return $application->fresh();
    }

    public function delete(string $id): bool
    {
        $application = $this->findOrFail($id);
        return (bool) $application->delete();
    }
}
