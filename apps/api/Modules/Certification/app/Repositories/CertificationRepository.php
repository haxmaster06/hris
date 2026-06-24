<?php

declare(strict_types=1);

namespace Modules\Certification\Repositories;

use Modules\Certification\Models\Certification;
use Illuminate\Pagination\LengthAwarePaginator;

class CertificationRepository implements CertificationRepositoryInterface
{
    public function __construct(
        private readonly Certification $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (!empty($filters['search'])) {
            $query->where('name', 'ilike', "%{$filters['search']}%")
                  ->orWhere('code', 'ilike', "%{$filters['search']}%")
                  ->orWhere('issuer', 'ilike', "%{$filters['search']}%");
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): Certification
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Certification
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Certification
    {
        $certification = $this->findOrFail($id);
        $certification->update($data);
        return $certification->fresh();
    }

    public function delete(string $id): bool
    {
        $certification = $this->findOrFail($id);
        return (bool) $certification->delete();
    }
}
