<?php

declare(strict_types=1);

namespace Modules\Employee\Repositories;

use Modules\Employee\Models\EmployeeExperience;
use Illuminate\Pagination\LengthAwarePaginator;

interface EmployeeExperienceRepositoryInterface
{
    public function paginate(string $employeeId, int $perPage): LengthAwarePaginator;
    public function findOrFail(string $id): EmployeeExperience;
    public function create(array $data): EmployeeExperience;
    public function update(string $id, array $data): EmployeeExperience;
    public function delete(string $id): bool;
}
