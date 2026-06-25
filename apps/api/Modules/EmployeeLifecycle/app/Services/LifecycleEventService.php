<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Services;

use Modules\EmployeeLifecycle\Repositories\LifecycleEventRepositoryInterface;
use Modules\EmployeeLifecycle\Models\LifecycleEvent;
use Modules\Employee\Models\Employee;
use Modules\Employee\Models\EmployeeHistory;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class LifecycleEventService
{
    public function __construct(
        private readonly LifecycleEventRepositoryInterface $repository
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate($filters);
    }

    public function findOrFail(string $id): LifecycleEvent
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): LifecycleEvent
    {
        return DB::transaction(function () use ($data) {
            // Auto fill "from" fields based on current employee status
            $employee = Employee::findOrFail($data['employee_id']);
            $data['from_position_id'] = $employee->position_id;
            $data['from_department_id'] = $employee->department_id;
            $data['from_branch_id'] = $employee->branch_id;
            $data['from_division_id'] = $employee->division_id;
            $data['from_grade_id'] = $employee->grade_id;
            $data['from_status'] = $employee->status;
            // Salary handling can be integrated later, currently set null or if provided in request
            
            return $this->repository->create($data);
        });
    }

    public function update(string $id, array $data): LifecycleEvent
    {
        return DB::transaction(function () use ($id, $data) {
            $event = $this->findOrFail($id);
            if ($event->status === 'executed') {
                throw new \Exception('Cannot update an executed lifecycle event.');
            }
            return $this->repository->update($id, $data);
        });
    }

    public function delete(string $id): bool
    {
        return DB::transaction(function () use ($id) {
            $event = $this->findOrFail($id);
            if ($event->status === 'executed') {
                throw new \Exception('Cannot delete an executed lifecycle event.');
            }
            return $this->repository->delete($id);
        });
    }

    public function execute(string $id): LifecycleEvent
    {
        return DB::transaction(function () use ($id) {
            $event = $this->findOrFail($id);

            if ($event->status === 'executed') {
                throw new \Exception('Lifecycle event has already been executed.');
            }

            $employee = $event->employee;
            $changes = [];

            // 1. Process Position Change
            if (!empty($event->to_position_id) && $event->to_position_id !== $employee->position_id) {
                $changes['position_id'] = [
                    'field' => 'position_id',
                    'old' => $employee->position_id,
                    'new' => $event->to_position_id
                ];
                $employee->position_id = $event->to_position_id;
            }

            // 2. Process Department Change
            if (!empty($event->to_department_id) && $event->to_department_id !== $employee->department_id) {
                $changes['department_id'] = [
                    'field' => 'department_id',
                    'old' => $employee->department_id,
                    'new' => $event->to_department_id
                ];
                $employee->department_id = $event->to_department_id;
            }

            // 3. Process Branch Change
            if (!empty($event->to_branch_id) && $event->to_branch_id !== $employee->branch_id) {
                $changes['branch_id'] = [
                    'field' => 'branch_id',
                    'old' => $employee->branch_id,
                    'new' => $event->to_branch_id
                ];
                $employee->branch_id = $event->to_branch_id;
            }

            // 4. Process Division Change
            if (!empty($event->to_division_id) && $event->to_division_id !== $employee->division_id) {
                $changes['division_id'] = [
                    'field' => 'division_id',
                    'old' => $employee->division_id,
                    'new' => $event->to_division_id
                ];
                $employee->division_id = $event->to_division_id;
            }

            // 5. Process Grade Change
            if (!empty($event->to_grade_id) && $event->to_grade_id !== $employee->grade_id) {
                $changes['grade_id'] = [
                    'field' => 'grade_id',
                    'old' => $employee->grade_id,
                    'new' => $event->to_grade_id
                ];
                $employee->grade_id = $event->to_grade_id;
            }

            // 6. Process Status Change
            if (!empty($event->to_status) && $event->to_status !== $employee->status) {
                $changes['status'] = [
                    'field' => 'status',
                    'old' => $employee->status,
                    'new' => $event->to_status
                ];
                $employee->status = $event->to_status;
            }

            // Save employee updates
            $employee->save();

            // Create EmployeeHistory records
            foreach ($changes as $change) {
                EmployeeHistory::create([
                    'employee_id' => $employee->id,
                    'type' => $event->event_type,
                    'field' => $change['field'],
                    'old_value' => $change['old'],
                    'new_value' => $change['new'],
                    'effective_date' => $event->effective_date,
                ]);
            }

            // Update LifecycleEvent status
            $event->status = 'executed';
            $event->approved_at = Carbon::now();
            $event->save();

            return $event->fresh();
        });
    }
}
