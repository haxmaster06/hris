<?php

declare(strict_types=1);

namespace Modules\Employee\Repositories;

use Modules\Employee\Models\EmployeeEducation;
use Illuminate\Pagination\LengthAwarePaginator;

interface EmployeeEducationRepositoryInterface
{
    public function paginate(string $employeeId, int $perPage): LengthAwarePaginator;
    public function findOrFail(string $id): EmployeeEducation;
    public function create(array $data): EmployeeEducation;
    public function update(string $id, array $data): EmployeeEducation;
    public function delete(string $id): bool;
}
