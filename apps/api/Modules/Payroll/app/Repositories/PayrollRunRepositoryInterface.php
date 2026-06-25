<?php

declare(strict_types=1);

namespace Modules\Payroll\Repositories;

use Modules\Payroll\Models\PayrollRun;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface PayrollRunRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): PayrollRun;
    public function findForEmployeeAndPeriod(string $employeeId, string $periodId): ?PayrollRun;
    public function findForPeriod(string $periodId): Collection;
    public function createOrUpdate(array $keys, array $data): PayrollRun;
    public function deleteForPeriod(string $periodId): bool;
}
