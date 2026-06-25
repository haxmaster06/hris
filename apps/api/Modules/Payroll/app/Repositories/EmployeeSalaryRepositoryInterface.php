<?php

declare(strict_types=1);

namespace Modules\Payroll\Repositories;

use Modules\Payroll\Models\EmployeeSalary;
use Illuminate\Pagination\LengthAwarePaginator;

interface EmployeeSalaryRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): EmployeeSalary;
    public function findLatestForEmployee(string $employeeId): ?EmployeeSalary;
    public function create(array $data): EmployeeSalary;
    public function update(string $id, array $data): EmployeeSalary;
    public function delete(string $id): bool;
}
