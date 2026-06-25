<?php

declare(strict_types=1);

namespace Modules\Workflow\Repositories;

use Modules\Workflow\Models\WorkflowInstance;
use Illuminate\Pagination\LengthAwarePaginator;

class WorkflowInstanceRepository implements WorkflowInstanceRepositoryInterface
{
    public function __construct(
        private readonly WorkflowInstance $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query()->with(['definition', 'initiator']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['initiated_by'])) {
            $query->where('initiated_by', $filters['initiated_by']);
        }

        if (!empty($filters['entity_type'])) {
            $query->where('entity_type', $filters['entity_type']);
        }

        if (!empty($filters['workflow_definition_id'])) {
            $query->where('workflow_definition_id', $filters['workflow_definition_id']);
        }

        // Tampilkan inbox approval untuk user saat ini (role atau user id spesifik)
        if (!empty($filters['pending_approver_user_id']) || !empty($filters['pending_approver_role_ids'])) {
            $query->where('status', 'in_progress')
                ->whereHas('definition.steps', function ($q) use ($filters) {
                    $q->whereColumn('step_order', 'workflow_instances.current_step_order')
                        ->where(function ($sub) use ($filters) {
                            if (!empty($filters['pending_approver_user_id'])) {
                                $sub->where('approver_user_id', $filters['pending_approver_user_id'])
                                   ->orWhere('approver_type', 'reports_to'); // Di-handle di business logic level atasan
                            }
                            if (!empty($filters['pending_approver_role_ids'])) {
                                $sub->orWhereIn('approver_role_id', $filters['pending_approver_role_ids']);
                            }
                        });
                });
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function findOrFail(string $id): WorkflowInstance
    {
        return $this->model->findOrFail($id);
    }

    public function findActiveForEntity(string $entityType, string $entityId): ?WorkflowInstance
    {
        return $this->model->where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->where('status', 'in_progress')
            ->first();
    }

    public function create(array $data): WorkflowInstance
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): WorkflowInstance
    {
        $instance = $this->findOrFail($id);
        $instance->update($data);
        return $instance->fresh();
    }

    public function delete(string $id): bool
    {
        $instance = $this->findOrFail($id);
        return (bool) $instance->delete();
    }
}
