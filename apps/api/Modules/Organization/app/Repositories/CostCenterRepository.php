<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\CostCenter;
use Illuminate\Pagination\LengthAwarePaginator;

class CostCenterRepository implements CostCenterRepositoryInterface
{
    public function __construct(
        private readonly CostCenter $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('code', 'like', $search);
            });
        }

        if (!empty($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('code', 'asc')->paginate($perPage);
    }

    public function findOrFail(string $id): CostCenter
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): CostCenter
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): CostCenter
    {
        $costCenter = $this->findOrFail($id);
        $costCenter->update($data);
        return $costCenter->fresh();
    }

    public function delete(string $id): bool
    {
        $costCenter = $this->findOrFail($id);
        return (bool) $costCenter->delete();
    }
}
