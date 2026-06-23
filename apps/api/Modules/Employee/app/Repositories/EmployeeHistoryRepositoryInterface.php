<?php

declare(strict_types=1);

namespace Modules\Employee\Repositories;

use Modules\Employee\Models\EmployeeHistory;
use Illuminate\Pagination\LengthAwarePaginator;

interface EmployeeHistoryRepositoryInterface
{
    public function paginate(string $employeeId, int $perPage): LengthAwarePaginator;
    public function findOrFail(string $id): EmployeeHistory;
    public function create(array $data): EmployeeHistory;
}
