<?php

declare(strict_types=1);

namespace Modules\Employee\Services;

use Modules\Employee\Repositories\EmployeeRepositoryInterface;
use Modules\Employee\Repositories\EmployeeHistoryRepositoryInterface;
use Modules\Employee\Models\Employee;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EmployeeService
{
    public function __construct(
        private readonly EmployeeRepositoryInterface $repository,
        private readonly EmployeeHistoryRepositoryInterface $historyRepository
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findOrFail(string $id): Employee
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): Employee
    {
        return DB::transaction(function () use ($data) {
            $employee = $this->repository->create($data);

            // Log initial history record for creation
            $this->historyRepository->create([
                'employee_id' => $employee->id,
                'type' => 'employment_created',
                'field' => 'status',
                'old_value' => null,
                'new_value' => $employee->status,
                'effective_date' => $employee->join_date->toDateString(),
            ]);

            return $employee;
        });
    }

    public function update(string $id, array $data): Employee
    {
        return DB::transaction(function () use ($id, $data) {
            $employee = $this->repository->findOrFail($id);
            
            // Capture original values for tracking changes
            $originalBranchId = $employee->branch_id;
            $originalDeptId = $employee->department_id;
            $originalPosId = $employee->position_id;
            $originalStatus = $employee->status;

            // Perform update
            $updatedEmployee = $this->repository->update($id, $data);

            // Track changes and write to employee_histories
            $effectiveDate = now()->toDateString();

            // 1. Branch change (Transfer)
            if (array_key_exists('branch_id', $data) && $originalBranchId !== $updatedEmployee->branch_id) {
                $this->historyRepository->create([
                    'employee_id' => $updatedEmployee->id,
                    'type' => 'transfer',
                    'field' => 'branch_id',
                    'old_value' => (string) $originalBranchId,
                    'new_value' => (string) $updatedEmployee->branch_id,
                    'effective_date' => $effectiveDate,
                ]);
            }

            // 2. Department change (Mutation)
            if (array_key_exists('department_id', $data) && $originalDeptId !== $updatedEmployee->department_id) {
                $this->historyRepository->create([
                    'employee_id' => $updatedEmployee->id,
                    'type' => 'mutation',
                    'field' => 'department_id',
                    'old_value' => (string) $originalDeptId,
                    'new_value' => (string) $updatedEmployee->department_id,
                    'effective_date' => $effectiveDate,
                ]);
            }

            // 3. Position change (Promotion/Demotion/Position Change)
            if (array_key_exists('position_id', $data) && $originalPosId !== $updatedEmployee->position_id) {
                $this->historyRepository->create([
                    'employee_id' => $updatedEmployee->id,
                    'type' => 'promotion', // default type for position change
                    'field' => 'position_id',
                    'old_value' => (string) $originalPosId,
                    'new_value' => (string) $updatedEmployee->position_id,
                    'effective_date' => $effectiveDate,
                ]);
            }

            // 4. Status change (Employment Status Flow)
            if (array_key_exists('status', $data) && $originalStatus !== $updatedEmployee->status) {
                $this->historyRepository->create([
                    'employee_id' => $updatedEmployee->id,
                    'type' => 'status_change',
                    'field' => 'status',
                    'old_value' => $originalStatus,
                    'new_value' => $updatedEmployee->status,
                    'effective_date' => $effectiveDate,
                ]);
            }

            return $updatedEmployee;
        });
    }

    public function delete(string $id): bool
    {
        return DB::transaction(function () use ($id) {
            return $this->repository->delete($id);
        });
    }
}
