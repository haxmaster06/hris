<?php

declare(strict_types=1);

namespace Modules\Employee\Services;

use Modules\Employee\Repositories\EmployeeEducationRepositoryInterface;
use Modules\Employee\Models\EmployeeEducation;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EmployeeEducationService
{
    public function __construct(
        private readonly EmployeeEducationRepositoryInterface $repository
    ) {}

    public function list(string $employeeId, array $filters = []): LengthAwarePaginator
    {
        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;
        return $this->repository->paginate($employeeId, $perPage);
    }

    public function findOrFail(string $id): EmployeeEducation
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): EmployeeEducation
    {
        return DB::transaction(function () use ($data) {
            return $this->repository->create($data);
        });
    }

    public function update(string $id, array $data): EmployeeEducation
    {
        return DB::transaction(function () use ($id, $data) {
            return $this->repository->update($id, $data);
        });
    }

    public function delete(string $id): bool
    {
        return DB::transaction(function () use ($id) {
            return $this->repository->delete($id);
        });
    }
}
