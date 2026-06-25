<?php

declare(strict_types=1);

namespace Modules\Compensation\Repositories;

use Modules\Compensation\Models\EmployeeBenefit;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface EmployeeBenefitRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findActiveForEmployee(string $employeeId): Collection;
    public function findOrFail(string $id): EmployeeBenefit;
    public function create(array $data): EmployeeBenefit;
    public function update(string $id, array $data): EmployeeBenefit;
    public function delete(string $id): bool;
}
