<?php

declare(strict_types=1);

namespace Modules\Recruitment\Repositories;

use Modules\Recruitment\Models\HiringApproval;
use Illuminate\Pagination\LengthAwarePaginator;

class HiringApprovalRepository implements HiringApprovalRepositoryInterface
{
    public function __construct(
        private readonly HiringApproval $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        // Eager load relations
        $query->with(['application.candidate', 'application.vacancy.position', 'approver']);

        if (!empty($filters['job_application_id'])) {
            $query->where('job_application_id', $filters['job_application_id']);
        }

        if (!empty($filters['approver_id'])) {
            $query->where('approver_id', $filters['approver_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['stage'])) {
            $query->where('stage', $filters['stage']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): HiringApproval
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): HiringApproval
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): HiringApproval
    {
        $approval = $this->findOrFail($id);
        $approval->update($data);
        return $approval->fresh();
    }

    public function delete(string $id): bool
    {
        $approval = $this->findOrFail($id);
        return (bool) $approval->delete();
    }
}
