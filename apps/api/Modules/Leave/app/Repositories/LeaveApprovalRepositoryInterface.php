<?php

declare(strict_types=1);

namespace Modules\Leave\Repositories;

use Modules\Leave\Models\LeaveApproval;
use Illuminate\Pagination\LengthAwarePaginator;

interface LeaveApprovalRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): LeaveApproval;
    public function create(array $data): LeaveApproval;
    public function update(string $id, array $data): LeaveApproval;
    public function delete(string $id): bool;
}
