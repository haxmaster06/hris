<?php

declare(strict_types=1);

namespace Modules\Certification\Repositories;

use Modules\Certification\Models\CertificationRequirement;
use Illuminate\Pagination\LengthAwarePaginator;

class CertificationRequirementRepository implements CertificationRequirementRepositoryInterface
{
    public function __construct(
        private readonly CertificationRequirement $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        // Eager load relations
        $query->with(['position.department', 'certification']);

        if (!empty($filters['position_id'])) {
            $query->where('position_id', $filters['position_id']);
        }

        if (!empty($filters['certification_id'])) {
            $query->where('certification_id', $filters['certification_id']);
        }

        if (isset($filters['is_mandatory'])) {
            $query->where('is_mandatory', (bool) $filters['is_mandatory']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->whereHas('position', function ($pq) use ($filters) {
                    $pq->where('name', 'ilike', "%{$filters['search']}%");
                })->orWhereHas('certification', function ($cq) use ($filters) {
                    $cq->where('name', 'ilike', "%{$filters['search']}%");
                });
            });
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): CertificationRequirement
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): CertificationRequirement
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): CertificationRequirement
    {
        $req = $this->findOrFail($id);
        $req->update($data);
        return $req->fresh();
    }

    public function delete(string $id): bool
    {
        $req = $this->findOrFail($id);
        return (bool) $req->delete();
    }
}
