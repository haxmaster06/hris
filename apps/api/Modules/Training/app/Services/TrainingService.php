<?php

declare(strict_types=1);

namespace Modules\Training\Services;

use Modules\Training\Repositories\TrainingRepositoryInterface;
use Modules\Training\Repositories\TrainingSessionRepositoryInterface;
use Modules\Training\Models\Training;
use Modules\Training\Models\TrainingSession;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TrainingService
{
    public function __construct(
        private readonly TrainingRepositoryInterface $trainingRepository,
        private readonly TrainingSessionRepositoryInterface $sessionRepository
    ) {}

    // === Training Master Operations ===

    public function listTrainings(array $filters = []): LengthAwarePaginator
    {
        return $this->trainingRepository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findTraining(string $id): Training
    {
        return $this->trainingRepository->findOrFail($id);
    }

    public function createTraining(array $data): Training
    {
        return DB::transaction(function () use ($data) {
            return $this->trainingRepository->create($data);
        });
    }

    public function updateTraining(string $id, array $data): Training
    {
        return DB::transaction(function () use ($id, $data) {
            return $this->trainingRepository->update($id, $data);
        });
    }

    public function deleteTraining(string $id): bool
    {
        return DB::transaction(function () use ($id) {
            return $this->trainingRepository->delete($id);
        });
    }

    // === Training Session Operations ===

    public function listSessions(array $filters = []): LengthAwarePaginator
    {
        return $this->sessionRepository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findSession(string $id): TrainingSession
    {
        return $this->sessionRepository->findOrFail($id);
    }

    public function createSession(array $data): TrainingSession
    {
        return DB::transaction(function () use ($data) {
            return $this->sessionRepository->create($data);
        });
    }

    public function updateSession(string $id, array $data): TrainingSession
    {
        return DB::transaction(function () use ($id, $data) {
            return $this->sessionRepository->update($id, $data);
        });
    }

    public function deleteSession(string $id): bool
    {
        return DB::transaction(function () use ($id) {
            return $this->sessionRepository->delete($id);
        });
    }
}
