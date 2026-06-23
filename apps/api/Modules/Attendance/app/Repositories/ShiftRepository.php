<?php

declare(strict_types=1);

namespace Modules\Attendance\Repositories;

use Modules\Attendance\Models\Shift;
use Illuminate\Pagination\LengthAwarePaginator;

class ShiftRepository implements ShiftRepositoryInterface
{
    public function __construct(
        private readonly Shift $model
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

    public function findOrFail(string $id): Shift
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Shift
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Shift
    {
        $shift = $this->findOrFail($id);
        $shift->update($data);
        return $shift->fresh();
    }

    public function delete(string $id): bool
    {
        $shift = $this->findOrFail($id);
        return (bool) $shift->delete();
    }
}
