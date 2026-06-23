<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\Company;
use Illuminate\Pagination\LengthAwarePaginator;

class CompanyRepository implements CompanyRepositoryInterface
{
    public function __construct(
        private readonly Company $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'ilike', "%{$filters['search']}%")
                  ->orWhere('code', 'ilike', "%{$filters['search']}%");
            });
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): Company
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Company
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Company
    {
        $company = $this->findOrFail($id);
        $company->update($data);
        return $company->fresh();
    }

    public function delete(string $id): bool
    {
        $company = $this->findOrFail($id);
        return (bool) $company->delete();
    }
}
