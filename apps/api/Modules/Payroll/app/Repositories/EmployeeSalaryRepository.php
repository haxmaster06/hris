<?php

declare(strict_types=1);

namespace Modules\Payroll\Repositories;

use Modules\Payroll\Models\EmployeeSalary;
use Illuminate\Pagination\LengthAwarePaginator;

class EmployeeSalaryRepository implements EmployeeSalaryRepositoryInterface
{
    public function __construct(
        private readonly EmployeeSalary $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query()->with('employee');

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (!empty($filters['search'])) {
            $query->whereHas('employee', function($q) use ($filters) {
                $q->where('first_name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('last_name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('employee_code', 'like', '%' . $filters['search'] . '%');
            });
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('effective_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function findOrFail(string $id): EmployeeSalary
    {
        return $this->model->findOrFail($id);
    }

    public function findLatestForEmployee(string $employeeId): ?EmployeeSalary
    {
        return $this->model->where('employee_id', $employeeId)
            ->where('effective_date', '<=', now()->toDateString())
            ->orderBy('effective_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->first();
    }

    public function create(array $data): EmployeeSalary
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): EmployeeSalary
    {
        $salary = $this->findOrFail($id);
        $salary->update($data);
        return $salary->fresh();
    }

    public function delete(string $id): bool
    {
        $salary = $this->findOrFail($id);
        return (bool) $salary->delete();
    }
}
