<?php

declare(strict_types=1);

namespace Modules\Organization\Services;

use Modules\Organization\Repositories\GradeRepositoryInterface;
use Modules\Organization\Models\Grade;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class GradeService
{
    public function __construct(
        private readonly GradeRepositoryInterface $repository
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findOrFail(string $id): Grade
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): Grade
    {
        return DB::transaction(function () use ($data) {
            return $this->repository->create($data);
        });
    }

    public function update(string $id, array $data): Grade
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
