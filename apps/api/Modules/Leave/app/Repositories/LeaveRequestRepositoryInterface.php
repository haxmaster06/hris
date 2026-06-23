<?php

declare(strict_types=1);

namespace Modules\Leave\Repositories;

use Modules\Leave\Models\LeaveRequest;
use Illuminate\Pagination\LengthAwarePaginator;

interface LeaveRequestRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): LeaveRequest;
    public function create(array $data): LeaveRequest;
    public function update(string $id, array $data): LeaveRequest;
    public function delete(string $id): bool;
}
