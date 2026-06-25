<?php

declare(strict_types=1);

namespace Modules\Payroll\Repositories;

use Modules\Payroll\Models\EmployeeAllowance;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EmployeeAllowanceRepository implements EmployeeAllowanceRepositoryInterface
{
    public function __construct(
        private readonly EmployeeAllowance $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query()->with(['employee', 'payrollComponent']);

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('effective_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function findActiveForEmployee(string $employeeId): Collection
    {
        $today = now()->toDateString();
        return $this->model->where('employee_id', $employeeId)
            ->where('is_active', true)
            ->where('effective_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')
                      ->orWhere('end_date', '>=', $today);
            })
            ->with('payrollComponent')
            ->get();
    }

    public function findOrFail(string $id): EmployeeAllowance
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): EmployeeAllowance
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): EmployeeAllowance
    {
        $allowance = $this->findOrFail($id);
        $allowance->update($data);
        return $allowance->fresh();
    }

    public function delete(string $id): bool
    {
        $allowance = $this->findOrFail($id);
        return (bool) $allowance->delete();
    }
}
