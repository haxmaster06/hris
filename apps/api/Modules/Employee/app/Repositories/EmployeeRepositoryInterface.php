<?php

declare(strict_types=1);

namespace Modules\Employee\Repositories;

use Modules\Employee\Models\Employee;
use Illuminate\Pagination\LengthAwarePaginator;

interface EmployeeRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Employee;
    public function create(array $data): Employee;
    public function update(string $id, array $data): Employee;
    public function delete(string $id): bool;
}
