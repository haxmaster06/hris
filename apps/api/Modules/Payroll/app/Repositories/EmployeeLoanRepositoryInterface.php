<?php

declare(strict_types=1);

namespace Modules\Payroll\Repositories;

use Modules\Payroll\Models\EmployeeLoan;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface EmployeeLoanRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findActiveForEmployee(string $employeeId): Collection;
    public function findOrFail(string $id): EmployeeLoan;
    public function create(array $data): EmployeeLoan;
    public function update(string $id, array $data): EmployeeLoan;
    public function delete(string $id): bool;
}
