<?php

declare(strict_types=1);

namespace Modules\Certification\Repositories;

use Modules\Certification\Models\EmployeeCertification;
use Illuminate\Pagination\LengthAwarePaginator;

class EmployeeCertificationRepository implements EmployeeCertificationRepositoryInterface
{
    public function __construct(
        private readonly EmployeeCertification $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        // Eager load relations
        $query->with(['employee', 'certification']);

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (!empty($filters['certification_id'])) {
            $query->where('certification_id', $filters['certification_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('certificate_number', 'ilike', "%{$filters['search']}%")
                  ->orWhereHas('employee', function ($eq) use ($filters) {
                      $eq->where('first_name', 'ilike', "%{$filters['search']}%")
                        ->orWhere('last_name', 'ilike', "%{$filters['search']}%")
                        ->orWhere('employee_number', 'ilike', "%{$filters['search']}%");
                  })
                  ->orWhereHas('certification', function ($cq) use ($filters) {
                      $cq->where('name', 'ilike', "%{$filters['search']}%");
                  });
            });
        }

        if (!empty($filters['expires_before'])) {
            $query->where('expired_date', '<=', $filters['expires_before']);
        }

        if (!empty($filters['expires_after'])) {
            $query->where('expired_date', '>=', $filters['expires_after']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): EmployeeCertification
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): EmployeeCertification
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): EmployeeCertification
    {
        $empCert = $this->findOrFail($id);
        $empCert->update($data);
        return $empCert->fresh();
    }

    public function delete(string $id): bool
    {
        $empCert = $this->findOrFail($id);
        return (bool) $empCert->delete();
    }
}
