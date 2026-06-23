<?php

declare(strict_types=1);

namespace Modules\Employee\Repositories;

use Modules\Employee\Models\EmployeeFamily;
use Illuminate\Pagination\LengthAwarePaginator;

interface EmployeeFamilyRepositoryInterface
{
    public function paginate(string $employeeId, int $perPage): LengthAwarePaginator;
    public function findOrFail(string $id): EmployeeFamily;
    public function create(array $data): EmployeeFamily;
    public function update(string $id, array $data): EmployeeFamily;
    public function delete(string $id): bool;
}
