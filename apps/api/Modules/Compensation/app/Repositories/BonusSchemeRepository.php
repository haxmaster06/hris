<?php

declare(strict_types=1);

namespace Modules\Compensation\Repositories;

use Modules\Compensation\Models\BonusScheme;
use Illuminate\Pagination\LengthAwarePaginator;

class BonusSchemeRepository implements BonusSchemeRepositoryInterface
{
    public function __construct(
        private readonly BonusScheme $model
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

    public function findOrFail(string $id): BonusScheme
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): BonusScheme
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): BonusScheme
    {
        $bs = $this->findOrFail($id);
        $bs->update($data);
        return $bs->fresh();
    }

    public function delete(string $id): bool
    {
        $bs = $this->findOrFail($id);
        return (bool) $bs->delete();
    }
}
