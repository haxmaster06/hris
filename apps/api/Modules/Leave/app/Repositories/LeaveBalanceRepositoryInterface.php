<?php

declare(strict_types=1);

namespace Modules\Leave\Repositories;

use Modules\Leave\Models\LeaveBalance;
use Illuminate\Pagination\LengthAwarePaginator;

interface LeaveBalanceRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): LeaveBalance;
    public function create(array $data): LeaveBalance;
    public function update(string $id, array $data): LeaveBalance;
    public function delete(string $id): bool;
    public function findByEmployeeAndType(string $employeeId, string $leaveTypeId, int $year): ?LeaveBalance;
}
