<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Repositories;

use Modules\EmployeeLifecycle\Models\LifecycleEvent;
use Illuminate\Pagination\LengthAwarePaginator;

interface LifecycleEventRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): LifecycleEvent;
    public function create(array $data): LifecycleEvent;
    public function update(string $id, array $data): LifecycleEvent;
    public function delete(string $id): bool;
}
