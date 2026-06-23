<?php

declare(strict_types=1);

namespace Modules\Attendance\Repositories;

use Modules\Attendance\Models\EmployeeShift;
use Illuminate\Pagination\LengthAwarePaginator;

interface EmployeeShiftRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): EmployeeShift;
    public function create(array $data): EmployeeShift;
    public function update(string $id, array $data): EmployeeShift;
    public function delete(string $id): bool;
    public function findActiveShift(string $employeeId, string $date): ?EmployeeShift;
}
