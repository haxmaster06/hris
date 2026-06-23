<?php

declare(strict_types=1);

namespace Modules\Employee\Repositories;

use Modules\Employee\Models\Employee;
use Illuminate\Pagination\LengthAwarePaginator;

class EmployeeRepository implements EmployeeRepositoryInterface
{
    public function __construct(
        private readonly Employee $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('first_name', 'ilike', "%{$filters['search']}%")
                  ->orWhere('last_name', 'ilike', "%{$filters['search']}%")
                  ->orWhere('employee_number', 'ilike', "%{$filters['search']}%");
            });
        }

        if (!empty($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }

        if (!empty($filters['branch_id'])) {
            $query->where('branch_id', $filters['branch_id']);
        }

        if (!empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        if (!empty($filters['position_id'])) {
            $query->where('position_id', $filters['position_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): Employee
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Employee
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Employee
    {
        $employee = $this->findOrFail($id);
        $employee->update($data);
        return $employee->fresh();
    }

    public function delete(string $id): bool
    {
        $employee = $this->findOrFail($id);
        return (bool) $employee->delete();
    }
}
