<?php

declare(strict_types=1);

namespace Modules\Payroll\Repositories;

use Modules\Payroll\Models\PayrollPeriod;
use Illuminate\Pagination\LengthAwarePaginator;

interface PayrollPeriodRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): PayrollPeriod;
    public function findByMonthAndYear(int $month, int $year): ?PayrollPeriod;
    public function create(array $data): PayrollPeriod;
    public function update(string $id, array $data): PayrollPeriod;
    public function delete(string $id): bool;
}
