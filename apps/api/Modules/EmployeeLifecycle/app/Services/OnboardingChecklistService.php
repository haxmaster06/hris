<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Services;

use Modules\EmployeeLifecycle\Repositories\OnboardingChecklistRepositoryInterface;
use Modules\EmployeeLifecycle\Models\OnboardingChecklist;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class OnboardingChecklistService
{
    public function __construct(
        private readonly OnboardingChecklistRepositoryInterface $repository
    ) {}

    public function list(string $employeeId, array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate($employeeId, $filters);
    }

    public function findOrFail(string $id): OnboardingChecklist
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): OnboardingChecklist
    {
        return DB::transaction(function () use ($data) {
            return $this->repository->create($data);
        });
    }

    public function update(string $id, array $data): OnboardingChecklist
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

    public function complete(string $id, bool $isCompleted): OnboardingChecklist
    {
        return DB::transaction(function () use ($id, $isCompleted) {
            $task = $this->findOrFail($id);
            $task->is_completed = $isCompleted;
            $task->completed_at = $isCompleted ? Carbon::now() : null;
            $task->save();

            return $task->fresh();
        });
    }
}
