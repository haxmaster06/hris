<?php

declare(strict_types=1);

namespace Modules\Leave\Repositories;

use Modules\Leave\Models\LeaveType;
use Illuminate\Pagination\LengthAwarePaginator;

class LeaveTypeRepository implements LeaveTypeRepositoryInterface
{
    public function __construct(
        private readonly LeaveType $model
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

    public function findOrFail(string $id): LeaveType
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): LeaveType
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): LeaveType
    {
        $type = $this->findOrFail($id);
        $type->update($data);
        return $type->fresh();
    }

    public function delete(string $id): bool
    {
        $type = $this->findOrFail($id);
        return (bool) $type->delete();
    }
}
