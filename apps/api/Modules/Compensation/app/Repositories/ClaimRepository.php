<?php

declare(strict_types=1);

namespace Modules\Compensation\Repositories;

use Modules\Compensation\Models\Claim;
use Illuminate\Pagination\LengthAwarePaginator;

class ClaimRepository implements ClaimRepositoryInterface
{
    public function __construct(
        private readonly Claim $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query()->with('employee');

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $query->whereHas('employee', function($q) use ($filters) {
                $q->where('first_name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('last_name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('employee_code', 'like', '%' . $filters['search'] . '%');
            })->orWhere('claim_number', 'like', '%' . $filters['search'] . '%');
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('claim_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function findOrFail(string $id): Claim
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Claim
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Claim
    {
        $claim = $this->findOrFail($id);
        $claim->update($data);
        return $claim->fresh();
    }

    public function delete(string $id): bool
    {
        $claim = $this->findOrFail($id);
        return (bool) $claim->delete();
    }
}
