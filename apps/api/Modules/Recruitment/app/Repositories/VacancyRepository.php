<?php

declare(strict_types=1);

namespace Modules\Recruitment\Repositories;

use Modules\Recruitment\Models\Vacancy;
use Illuminate\Pagination\LengthAwarePaginator;

class VacancyRepository implements VacancyRepositoryInterface
{
    public function __construct(
        private readonly Vacancy $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query();

        // Eager load relations
        $query->with(['company', 'branch', 'department', 'position']);

        if (!empty($filters['search'])) {
            $query->where('title', 'ilike', "%{$filters['search']}%");
        }

        if (!empty($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }

        if (!empty($filters['branch_id'])) {
            $query->where('branch_id', $filters['branch_id']);
        }

        if (!empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        if (!empty($filters['position_id'])) {
            $query->where('position_id', $filters['position_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): Vacancy
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Vacancy
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): Vacancy
    {
        $vacancy = $this->findOrFail($id);
        $vacancy->update($data);
        return $vacancy->fresh();
    }

    public function delete(string $id): bool
    {
        $vacancy = $this->findOrFail($id);
        return (bool) $vacancy->delete();
    }
}
