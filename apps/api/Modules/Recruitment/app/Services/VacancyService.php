<?php

declare(strict_types=1);

namespace Modules\Recruitment\Services;

use Modules\Recruitment\Repositories\VacancyRepositoryInterface;
use Modules\Recruitment\Models\Vacancy;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class VacancyService
{
    public function __construct(
        private readonly VacancyRepositoryInterface $repository
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findOrFail(string $id): Vacancy
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): Vacancy
    {
        return DB::transaction(function () use ($data) {
            return $this->repository->create($data);
        });
    }

    public function update(string $id, array $data): Vacancy
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

    public function publish(string $id): Vacancy
    {
        return $this->update($id, ['status' => 'published']);
    }

    public function close(string $id): Vacancy
    {
        return $this->update($id, ['status' => 'closed']);
    }
}
