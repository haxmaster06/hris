<?php

declare(strict_types=1);

namespace Modules\Recruitment\Services;

use Modules\Recruitment\Repositories\InterviewRepositoryInterface;
use Modules\Recruitment\Models\Interview;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class InterviewService
{
    public function __construct(
        private readonly InterviewRepositoryInterface $repository
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findOrFail(string $id): Interview
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): Interview
    {
        return DB::transaction(function () use ($data) {
            return $this->repository->create($data);
        });
    }

    public function update(string $id, array $data): Interview
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

    public function submitResult(string $id, array $result): Interview
    {
        return DB::transaction(function () use ($id, $result) {
            $data = [
                'score' => $result['score'],
                'notes' => $result['notes'] ?? null,
                'status' => 'completed',
            ];
            return $this->repository->update($id, $data);
        });
    }
}
