<?php

declare(strict_types=1);

namespace Modules\Employee\Repositories;

use Modules\Employee\Models\EmployeeHistory;
use Illuminate\Pagination\LengthAwarePaginator;

class EmployeeHistoryRepository implements EmployeeHistoryRepositoryInterface
{
    public function __construct(
        private readonly EmployeeHistory $model
    ) {}

    public function paginate(string $employeeId, int $perPage = 20): LengthAwarePaginator
    {
        return $this->model->query()
            ->where('employee_id', $employeeId)
            ->orderBy('effective_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function findOrFail(string $id): EmployeeHistory
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): EmployeeHistory
    {
        return $this->model->create($data);
    }
}
