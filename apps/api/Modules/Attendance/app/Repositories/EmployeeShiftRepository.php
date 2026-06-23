<?php

declare(strict_types=1);

namespace Modules\Attendance\Repositories;

use Modules\Attendance\Models\EmployeeShift;
use Illuminate\Pagination\LengthAwarePaginator;

class EmployeeShiftRepository implements EmployeeShiftRepositoryInterface
{
    public function __construct(
        private readonly EmployeeShift $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query()->with(['shift', 'employee']);

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (!empty($filters['shift_id'])) {
            $query->where('shift_id', $filters['shift_id']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): EmployeeShift
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): EmployeeShift
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): EmployeeShift
    {
        $employeeShift = $this->findOrFail($id);
        $employeeShift->update($data);
        return $employeeShift->fresh();
    }

    public function delete(string $id): bool
    {
        $employeeShift = $this->findOrFail($id);
        return (bool) $employeeShift->delete();
    }

    public function findActiveShift(string $employeeId, string $date): ?EmployeeShift
    {
        return $this->model->query()
            ->where('employee_id', $employeeId)
            ->where('start_date', '<=', $date)
            ->where(function ($query) use ($date) {
                $query->whereNull('end_date')
                      ->orWhere('end_date', '>=', $date);
            })
            ->with('shift')
            ->orderBy('start_date', 'desc')
            ->first();
    }
}
