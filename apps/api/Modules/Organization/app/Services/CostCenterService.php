<?php

declare(strict_types=1);

namespace Modules\Organization\Services;

use Modules\Organization\Repositories\CostCenterRepositoryInterface;
use Modules\Organization\Models\CostCenter;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CostCenterService
{
    public function __construct(
        private readonly CostCenterRepositoryInterface $repository
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate($filters);
    }

    public function findOrFail(string $id): CostCenter
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): CostCenter
    {
        return DB::transaction(function () use ($data) {
            return $this->repository->create($data);
        });
    }

    public function update(string $id, array $data): CostCenter
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
