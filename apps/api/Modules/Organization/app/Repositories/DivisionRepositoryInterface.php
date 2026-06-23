<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\Division;
use Illuminate\Pagination\LengthAwarePaginator;

interface DivisionRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Division;
    public function create(array $data): Division;
    public function update(string $id, array $data): Division;
    public function delete(string $id): bool;
}
