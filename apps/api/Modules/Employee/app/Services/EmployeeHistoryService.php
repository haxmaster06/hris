<?php

declare(strict_types=1);

namespace Modules\Employee\Services;

use Modules\Employee\Repositories\EmployeeHistoryRepositoryInterface;
use Modules\Employee\Models\EmployeeHistory;
use Illuminate\Pagination\LengthAwarePaginator;

class EmployeeHistoryService
{
    public function __construct(
        private readonly EmployeeHistoryRepositoryInterface $repository
    ) {}

    public function list(string $employeeId, array $filters = []): LengthAwarePaginator
    {
        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;
        return $this->repository->paginate($employeeId, $perPage);
    }

    public function findOrFail(string $id): EmployeeHistory
    {
        return $this->repository->findOrFail($id);
    }
}
