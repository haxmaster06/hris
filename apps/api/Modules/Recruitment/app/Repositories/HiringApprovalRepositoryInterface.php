<?php

declare(strict_types=1);

namespace Modules\Recruitment\Repositories;

use Modules\Recruitment\Models\HiringApproval;
use Illuminate\Pagination\LengthAwarePaginator;

interface HiringApprovalRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): HiringApproval;
    public function create(array $data): HiringApproval;
    public function update(string $id, array $data): HiringApproval;
    public function delete(string $id): bool;
}
