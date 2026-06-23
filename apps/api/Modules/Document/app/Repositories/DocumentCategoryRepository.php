<?php

declare(strict_types=1);

namespace Modules\Document\Repositories;

use Modules\Document\Models\DocumentCategory;
use Illuminate\Pagination\LengthAwarePaginator;

class DocumentCategoryRepository implements DocumentCategoryRepositoryInterface
{
    public function __construct(
        private readonly DocumentCategory $model
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

    public function findOrFail(string $id): DocumentCategory
    {
        return $this->model->findOrFail($id);
    }

    public function findByCode(string $code): ?DocumentCategory
    {
        return $this->model->where('code', strtoupper($code))->first();
    }

    public function create(array $data): DocumentCategory
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): DocumentCategory
    {
        $category = $this->findOrFail($id);
        $category->update($data);
        return $category->fresh();
    }

    public function delete(string $id): bool
    {
        $category = $this->findOrFail($id);
        return (bool) $category->delete();
    }
}
