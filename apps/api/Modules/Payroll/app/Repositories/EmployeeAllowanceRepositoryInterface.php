<?php

declare(strict_types=1);

namespace Modules\Payroll\Repositories;

use Modules\Payroll\Models\EmployeeAllowance;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface EmployeeAllowanceRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findActiveForEmployee(string $employeeId): Collection;
    public function findOrFail(string $id): EmployeeAllowance;
    public function create(array $data): EmployeeAllowance;
    public function update(string $id, array $data): EmployeeAllowance;
    public function delete(string $id): bool;
}
