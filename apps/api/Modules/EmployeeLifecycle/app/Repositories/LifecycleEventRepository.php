<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Repositories;

use Modules\EmployeeLifecycle\Models\LifecycleEvent;
use Illuminate\Pagination\LengthAwarePaginator;

class LifecycleEventRepository implements LifecycleEventRepositoryInterface
{
    public function __construct(
        private readonly LifecycleEvent $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (!empty($filters['event_type'])) {
            $query->where('event_type', $filters['event_type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['effective_date_from'])) {
            $query->where('effective_date', '>=', $filters['effective_date_from']);
        }

        if (!empty($filters['effective_date_to'])) {
            $query->where('effective_date', '<=', $filters['effective_date_to']);
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('effective_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function findOrFail(string $id): LifecycleEvent
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): LifecycleEvent
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): LifecycleEvent
    {
        $event = $this->findOrFail($id);
        $event->update($data);
        return $event->fresh();
    }

    public function delete(string $id): bool
    {
        $event = $this->findOrFail($id);
        return (bool) $event->delete();
    }
}
