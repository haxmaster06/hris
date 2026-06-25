<?php

declare(strict_types=1);

namespace Modules\Payroll\Repositories;

use Modules\Payroll\Models\PayrollComponent;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class PayrollComponentRepository implements PayrollComponentRepositoryInterface
{
    public function __construct(
        private readonly PayrollComponent $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        if (!empty($filters['search'])) {
            $query->where(function($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('code', 'like', '%' . $filters['search'] . '%');
            });
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function allActive(): Collection
    {
        return $this->model->query()->where('is_active', true)->orderBy('sort_order', 'asc')->get();
    }

    public function findOrFail(string $id): PayrollComponent
    {
        return $this->model->findOrFail($id);
    }

    public function findByCode(string $code): ?PayrollComponent
    {
        return $this->model->where('code', $code)->first();
    }

    public function create(array $data): PayrollComponent
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): PayrollComponent
    {
        $component = $this->findOrFail($id);
        $component->update($data);
        return $component->fresh();
    }

    public function delete(string $id): bool
    {
        $component = $this->findOrFail($id);
        return (bool) $component->delete();
    }
}
