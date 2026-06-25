<?php

declare(strict_types=1);

namespace Modules\Compensation\Repositories;

use Modules\Compensation\Models\Benefit;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class BenefitRepository implements BenefitRepositoryInterface
{
    public function __construct(
        private readonly Benefit $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        if (!empty($filters['search'])) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('name', 'asc')
            ->paginate($perPage);
    }

    public function allActive(): Collection
    {
        return $this->model->where('is_active', true)->orderBy('name', 'asc')->get();
    }

    public function findOrFail(string $id): Benefit
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Benefit
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Benefit
    {
        $benefit = $this->findOrFail($id);
        $benefit->update($data);
        return $benefit->fresh();
    }

    public function delete(string $id): bool
    {
        $benefit = $this->findOrFail($id);
        return (bool) $benefit->delete();
    }
}
