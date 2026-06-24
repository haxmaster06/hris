<?php

declare(strict_types=1);

namespace Modules\Training\Repositories;

use Modules\Training\Models\TrainingParticipant;
use Illuminate\Pagination\LengthAwarePaginator;

class TrainingParticipantRepository implements TrainingParticipantRepositoryInterface
{
    public function __construct(
        private readonly TrainingParticipant $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        // Eager load relations
        $query->with(['session.training', 'employee']);

        if (!empty($filters['training_session_id'])) {
            $query->where('training_session_id', $filters['training_session_id']);
        }

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (!empty($filters['attendance_status'])) {
            $query->where('attendance_status', $filters['attendance_status']);
        }

        if (!empty($filters['result_status'])) {
            $query->where('result_status', $filters['result_status']);
        }

        if (!empty($filters['search'])) {
            $query->whereHas('employee', function ($q) use ($filters) {
                $q->where('first_name', 'ilike', "%{$filters['search']}%")
                  ->orWhere('last_name', 'ilike', "%{$filters['search']}%")
                  ->orWhere('employee_number', 'ilike', "%{$filters['search']}%");
            });
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): TrainingParticipant
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): TrainingParticipant
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): TrainingParticipant
    {
        $participant = $this->findOrFail($id);
        $participant->update($data);
        return $participant->fresh();
    }

    public function delete(string $id): bool
    {
        $participant = $this->findOrFail($id);
        return (bool) $participant->delete();
    }
}
