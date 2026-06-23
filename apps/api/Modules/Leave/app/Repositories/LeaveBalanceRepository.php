<?php

declare(strict_types=1);

namespace Modules\Leave\Repositories;

use Modules\Leave\Models\LeaveBalance;
use Illuminate\Pagination\LengthAwarePaginator;

class LeaveBalanceRepository implements LeaveBalanceRepositoryInterface
{
    public function __construct(
        private readonly LeaveBalance $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query()->with(['leaveType', 'employee']);

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (!empty($filters['leave_type_id'])) {
            $query->where('leave_type_id', $filters['leave_type_id']);
        }

        if (!empty($filters['year'])) {
            $query->where('year', $filters['year']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): LeaveBalance
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): LeaveBalance
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): LeaveBalance
    {
        $balance = $this->findOrFail($id);
        $balance->update($data);
        return $balance->fresh();
    }

    public function delete(string $id): bool
    {
        $balance = $this->findOrFail($id);
        return (bool) $balance->delete();
    }

    public function findByEmployeeAndType(string $employeeId, string $leaveTypeId, int $year): ?LeaveBalance
    {
        return $this->model->query()
            ->where('employee_id', $employeeId)
            ->where('leave_type_id', $leaveTypeId)
            ->where('year', $year)
            ->first();
    }
}
