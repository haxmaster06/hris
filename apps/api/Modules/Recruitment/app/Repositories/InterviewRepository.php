<?php

declare(strict_types=1);

namespace Modules\Recruitment\Repositories;

use Modules\Recruitment\Models\Interview;
use Illuminate\Pagination\LengthAwarePaginator;

class InterviewRepository implements InterviewRepositoryInterface
{
    public function __construct(
        private readonly Interview $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        // Eager load relations
        $query->with(['application.candidate', 'application.vacancy.position', 'interviewer']);

        if (!empty($filters['job_application_id'])) {
            $query->where('job_application_id', $filters['job_application_id']);
        }

        if (!empty($filters['interviewer_id'])) {
            $query->where('interviewer_id', $filters['interviewer_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): Interview
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Interview
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Interview
    {
        $interview = $this->findOrFail($id);
        $interview->update($data);
        return $interview->fresh();
    }

    public function delete(string $id): bool
    {
        $interview = $this->findOrFail($id);
        return (bool) $interview->delete();
    }
}
