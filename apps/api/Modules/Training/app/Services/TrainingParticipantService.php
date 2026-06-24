<?php

declare(strict_types=1);

namespace Modules\Training\Services;

use Modules\Training\Repositories\TrainingParticipantRepositoryInterface;
use Modules\Training\Models\TrainingParticipant;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TrainingParticipantService
{
    public function __construct(
        private readonly TrainingParticipantRepositoryInterface $repository
    ) {}

    public function listParticipants(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findParticipant(string $id): TrainingParticipant
    {
        return $this->repository->findOrFail($id);
    }

    public function enroll(array $data): TrainingParticipant
    {
        return DB::transaction(function () use ($data) {
            return $this->repository->create([
                'training_session_id' => $data['training_session_id'],
                'employee_id' => $data['employee_id'],
                'attendance_status' => 'Pending',
                'result_status' => 'Pending',
                'score' => null,
                'remarks' => $data['remarks'] ?? null,
            ]);
        });
    }

    public function recordAttendance(string $id, string $status, ?string $remarks = null): TrainingParticipant
    {
        return DB::transaction(function () use ($id, $status, $remarks) {
            $data = ['attendance_status' => $status];
            if ($remarks !== null) {
                $data['remarks'] = $remarks;
            }
            return $this->repository->update($id, $data);
        });
    }

    public function recordResult(string $id, string $resultStatus, ?float $score = null, ?string $remarks = null): TrainingParticipant
    {
        return DB::transaction(function () use ($id, $resultStatus, $score, $remarks) {
            $data = ['result_status' => $resultStatus];
            if ($score !== null) {
                $data['score'] = $score;
            }
            if ($remarks !== null) {
                $data['remarks'] = $remarks;
            }
            return $this->repository->update($id, $data);
        });
    }

    public function removeParticipant(string $id): bool
    {
        return DB::transaction(function () use ($id) {
            return $this->repository->delete($id);
        });
    }
}
