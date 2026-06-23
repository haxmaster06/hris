<?php

declare(strict_types=1);

namespace Modules\Leave\Repositories;

use Modules\Leave\Models\LeaveRequest;
use Illuminate\Pagination\LengthAwarePaginator;

class LeaveRequestRepository implements LeaveRequestRepositoryInterface
{
    public function __construct(
        private readonly LeaveRequest $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query()->with(['leaveType', 'employee', 'approvals.approver']);

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (!empty($filters['leave_type_id'])) {
            $query->where('leave_type_id', $filters['leave_type_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): LeaveRequest
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): LeaveRequest
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): LeaveRequest
    {
        $request = $this->findOrFail($id);
        $request->update($data);
        return $request->fresh();
    }

    public function delete(string $id): bool
    {
        $request = $this->findOrFail($id);
        return (bool) $request->delete();
    }
}
