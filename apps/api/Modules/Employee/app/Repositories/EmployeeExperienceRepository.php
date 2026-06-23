<?php

declare(strict_types=1);

namespace Modules\Employee\Repositories;

use Modules\Employee\Models\EmployeeExperience;
use Illuminate\Pagination\LengthAwarePaginator;

class EmployeeExperienceRepository implements EmployeeExperienceRepositoryInterface
{
    public function __construct(
        private readonly EmployeeExperience $model
    ) {}

    public function paginate(string $employeeId, int $perPage = 20): LengthAwarePaginator
    {
        return $this->model->query()
            ->where('employee_id', $employeeId)
            ->orderBy('start_date', 'desc')
            ->paginate($perPage);
    }

    public function findOrFail(string $id): EmployeeExperience
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): EmployeeExperience
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): EmployeeExperience
    {
        $experience = $this->findOrFail($id);
        $experience->update($data);
        return $experience->fresh();
    }

    public function delete(string $id): bool
    {
        $experience = $this->findOrFail($id);
        return (bool) $experience->delete();
    }
}
