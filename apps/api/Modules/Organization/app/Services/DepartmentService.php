<?php

declare(strict_types=1);

namespace Modules\Organization\Services;

use Modules\Organization\Repositories\DepartmentRepositoryInterface;
use Modules\Organization\Models\Department;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DepartmentService
{
    public function __construct(
        private readonly DepartmentRepositoryInterface $repository
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findOrFail(string $id): Department
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): Department
    {
        return DB::transaction(function () use ($data) {
            return $this->repository->create($data);
        });
    }

    public function update(string $id, array $data): Department
    {
        if (!empty($data['parent_id'])) {
            if ($this->hasCircularReference($id, $data['parent_id'])) {
                throw ValidationException::withMessages([
                    'parent_id' => ['Circular dependency detected. A department cannot be a child/descendant of itself.']
                ]);
            }
        }

        return DB::transaction(function () use ($id, $data) {
            return $this->repository->update($id, $data);
        });
    }

    public function delete(string $id): bool
    {
        return DB::transaction(function () use ($id) {
            return $this->repository->delete($id);
        });
    }

    /**
     * Check if setting parent_id creates a circular reference.
     */
    private function hasCircularReference(string $departmentId, string $parentId): bool
    {
        if ($departmentId === $parentId) {
            return true;
        }

        $currentParentId = $parentId;
        while ($currentParentId) {
            $parent = $this->repository->find($currentParentId);
            if (!$parent) {
                break;
            }

            if ($parent->parent_id === $departmentId) {
                return true;
            }

            $currentParentId = $parent->parent_id;
        }

        return false;
    }
}
