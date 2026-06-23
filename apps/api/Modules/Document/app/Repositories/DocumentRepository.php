<?php

declare(strict_types=1);

namespace Modules\Document\Repositories;

use Modules\Document\Models\Document;
use Illuminate\Pagination\LengthAwarePaginator;

class DocumentRepository implements DocumentRepositoryInterface
{
    public function __construct(
        private readonly Document $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query()->with(['category']);

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('original_name', 'ilike', "%{$filters['search']}%")
                  ->orWhere('file_name', 'ilike', "%{$filters['search']}%");
            });
        }

        if (!empty($filters['document_category_id'])) {
            $query->where('document_category_id', $filters['document_category_id']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): Document
    {
        return $this->model->findOrFail($id);
    }

    public function findByEmployee(string $employeeId, array $filters = []): LengthAwarePaginator
    {
        $filters['employee_id'] = $employeeId;
        
        $query = $this->model->query()
            ->with(['category'])
            ->where('employee_id', $employeeId);

        if (!empty($filters['search'])) {
            $query->where('original_name', 'ilike', "%{$filters['search']}%");
        }

        if (!empty($filters['document_category_id'])) {
            $query->where('document_category_id', $filters['document_category_id']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->paginate($perPage);
    }

    public function create(array $data): Document
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Document
    {
        $document = $this->findOrFail($id);
        $document->update($data);
        return $document->fresh();
    }

    public function delete(string $id): bool
    {
        $document = $this->findOrFail($id);
        return (bool) $document->delete();
    }
}
