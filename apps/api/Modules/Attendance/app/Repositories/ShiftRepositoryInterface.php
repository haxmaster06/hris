<?php

declare(strict_types=1);

namespace Modules\Attendance\Repositories;

use Modules\Attendance\Models\Shift;
use Illuminate\Pagination\LengthAwarePaginator;

interface ShiftRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Shift;
    public function create(array $data): Shift;
    public function update(string $id, array $data): Shift;
    public function delete(string $id): bool;
}
