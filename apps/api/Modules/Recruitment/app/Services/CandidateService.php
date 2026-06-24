<?php

declare(strict_types=1);

namespace Modules\Recruitment\Services;

use Modules\Recruitment\Repositories\CandidateRepositoryInterface;
use Modules\Recruitment\Models\Candidate;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CandidateService
{
    public function __construct(
        private readonly CandidateRepositoryInterface $repository
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findOrFail(string $id): Candidate
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): Candidate
    {
        return DB::transaction(function () use ($data) {
            return $this->repository->create($data);
        });
    }

    public function update(string $id, array $data): Candidate
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
}
