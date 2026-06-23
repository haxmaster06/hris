<?php

declare(strict_types=1);

namespace Modules\Leave\Repositories;

use Modules\Leave\Models\LeaveApproval;
use Illuminate\Pagination\LengthAwarePaginator;

class LeaveApprovalRepository implements LeaveApprovalRepositoryInterface
{
    public function __construct(
        private readonly LeaveApproval $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query()->with(['leaveRequest', 'approver']);

        if (!empty($filters['leave_request_id'])) {
            $query->where('leave_request_id', $filters['leave_request_id']);
        }

        if (!empty($filters['approver_id'])) {
            $query->where('approver_id', $filters['approver_id']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): LeaveApproval
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): LeaveApproval
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): LeaveApproval
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
