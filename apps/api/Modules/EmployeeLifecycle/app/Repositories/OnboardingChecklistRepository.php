<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Repositories;

use Modules\EmployeeLifecycle\Models\OnboardingChecklist;
use Illuminate\Pagination\LengthAwarePaginator;

class OnboardingChecklistRepository implements OnboardingChecklistRepositoryInterface
{
    public function __construct(
        private readonly OnboardingChecklist $model
    ) {}

    public function paginate(string $employeeId, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query()->where('employee_id', $employeeId);

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['is_completed'])) {
            $query->where('is_completed', filter_var($filters['is_completed'], FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 50;

        return $query->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);
    }

    public function findOrFail(string $id): OnboardingChecklist
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): OnboardingChecklist
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): OnboardingChecklist
    {
        $task = $this->findOrFail($id);
        $task->update($data);
        return $task->fresh();
    }

    public function delete(string $id): bool
    {
        $task = $this->findOrFail($id);
        return (bool) $task->delete();
    }
}
