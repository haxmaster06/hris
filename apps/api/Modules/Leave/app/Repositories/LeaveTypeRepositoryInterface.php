<?php

declare(strict_types=1);

namespace Modules\Leave\Repositories;

use Modules\Leave\Models\LeaveType;
use Illuminate\Pagination\LengthAwarePaginator;

interface LeaveTypeRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): LeaveType;
    public function create(array $data): LeaveType;
    public function update(string $id, array $data): LeaveType;
    public function delete(string $id): bool;
}
