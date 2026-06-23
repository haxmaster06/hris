<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\Department;
use Illuminate\Pagination\LengthAwarePaginator;

interface DepartmentRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function find(string $id): ?Department;
    public function findOrFail(string $id): Department;
    public function create(array $data): Department;
    public function update(string $id, array $data): Department;
    public function delete(string $id): bool;
}
