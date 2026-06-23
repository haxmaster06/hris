<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\Position;
use Illuminate\Pagination\LengthAwarePaginator;

interface PositionRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Position;
    public function create(array $data): Position;
    public function update(string $id, array $data): Position;
    public function delete(string $id): bool;
}
