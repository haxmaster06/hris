<?php

declare(strict_types=1);

namespace Modules\Employee\Repositories;

use Modules\Employee\Models\EmployeeEducation;
use Illuminate\Pagination\LengthAwarePaginator;

class EmployeeEducationRepository implements EmployeeEducationRepositoryInterface
{
    public function __construct(
        private readonly EmployeeEducation $model
    ) {}

    public function paginate(string $employeeId, int $perPage = 20): LengthAwarePaginator
    {
        return $this->model->query()
            ->where('employee_id', $employeeId)
            ->orderBy('graduation_year', 'desc')
            ->paginate($perPage);
    }

    public function findOrFail(string $id): EmployeeEducation
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): EmployeeEducation
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): EmployeeEducation
    {
        $education = $this->findOrFail($id);
        $education->update($data);
        return $education->fresh();
    }

    public function delete(string $id): bool
    {
        $education = $this->findOrFail($id);
        return (bool) $education->delete();
    }
}
