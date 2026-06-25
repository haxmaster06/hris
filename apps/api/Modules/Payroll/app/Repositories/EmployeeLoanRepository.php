<?php

declare(strict_types=1);

namespace Modules\Payroll\Repositories;

use Modules\Payroll\Models\EmployeeLoan;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EmployeeLoanRepository implements EmployeeLoanRepositoryInterface
{
    public function __construct(
        private readonly EmployeeLoan $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query()->with('employee');

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $query->whereHas('employee', function($q) use ($filters) {
                $q->where('first_name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('last_name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('employee_code', 'like', '%' . $filters['search'] . '%');
            });
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function findActiveForEmployee(string $employeeId): Collection
    {
        return $this->model->where('employee_id', $employeeId)
            ->where('status', 'active')
            ->where('remaining_amount', '>', 0)
            ->get();
    }

    public function findOrFail(string $id): EmployeeLoan
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): EmployeeLoan
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): EmployeeLoan
    {
        $loan = $this->findOrFail($id);
        $loan->update($data);
        return $loan->fresh();
    }

    public function delete(string $id): bool
    {
        $loan = $this->findOrFail($id);
        return (bool) $loan->delete();
    }
}
