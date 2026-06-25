<?php

declare(strict_types=1);

namespace Modules\Payroll\Repositories;

use Modules\Payroll\Models\PayrollComponent;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface PayrollComponentRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function allActive(): Collection;
    public function findOrFail(string $id): PayrollComponent;
    public function findByCode(string $code): ?PayrollComponent;
    public function create(array $data): PayrollComponent;
    public function update(string $id, array $data): PayrollComponent;
    public function delete(string $id): bool;
}
