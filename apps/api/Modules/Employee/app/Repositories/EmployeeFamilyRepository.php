<?php

declare(strict_types=1);

namespace Modules\Employee\Repositories;

use Modules\Employee\Models\EmployeeFamily;
use Illuminate\Pagination\LengthAwarePaginator;

class EmployeeFamilyRepository implements EmployeeFamilyRepositoryInterface
{
    public function __construct(
        private readonly EmployeeFamily $model
    ) {}

    public function paginate(string $employeeId, int $perPage = 20): LengthAwarePaginator
    {
        return $this->model->query()
            ->where('employee_id', $employeeId)
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);
    }

    public function findOrFail(string $id): EmployeeFamily
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): EmployeeFamily
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): EmployeeFamily
    {
        $family = $this->findOrFail($id);
        $family->update($data);
        return $family->fresh();
    }

    public function delete(string $id): bool
    {
        $family = $this->findOrFail($id);
        return (bool) $family->delete();
    }
}
