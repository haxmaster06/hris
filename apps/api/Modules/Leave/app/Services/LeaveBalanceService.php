<?php

declare(strict_types=1);

namespace Modules\Leave\Services;

use Modules\Leave\Repositories\LeaveBalanceRepositoryInterface;
use Modules\Leave\Models\LeaveBalance;
use Illuminate\Pagination\LengthAwarePaginator;

class LeaveBalanceService
{
    public function __construct(
        private readonly LeaveBalanceRepositoryInterface $repository
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findOrFail(string $id): LeaveBalance
    {
        return $this->repository->findOrFail($id);
    }
}
