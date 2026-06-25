<?php

declare(strict_types=1);

namespace Modules\Compensation\Repositories;

use Modules\Compensation\Models\EmployeeBenefit;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EmployeeBenefitRepository implements EmployeeBenefitRepositoryInterface
{
    public function __construct(
        private readonly EmployeeBenefit $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query()->with(['employee', 'benefit']);

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (!empty($filters['benefit_id'])) {
            $query->where('benefit_id', $filters['benefit_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('start_date', 'desc')
            ->paginate($perPage);
    }

    public function findActiveForEmployee(string $employeeId): Collection
    {
        return $this->model->where('employee_id', $employeeId)
            ->where('status', 'active')
            ->with('benefit')
            ->get();
    }

    public function findOrFail(string $id): EmployeeBenefit
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): EmployeeBenefit
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): EmployeeBenefit
    {
        $eb = $this->findOrFail($id);
        $eb->update($data);
        return $eb->fresh();
    }

    public function delete(string $id): bool
    {
        $eb = $this->findOrFail($id);
        return (bool) $eb->delete();
    }
}
