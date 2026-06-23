<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\Branch;
use Illuminate\Pagination\LengthAwarePaginator;

interface BranchRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Branch;
    public function create(array $data): Branch;
    public function update(string $id, array $data): Branch;
    public function delete(string $id): bool;
}
