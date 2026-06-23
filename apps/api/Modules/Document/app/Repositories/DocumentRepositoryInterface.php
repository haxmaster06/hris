<?php

declare(strict_types=1);

namespace Modules\Document\Repositories;

use Modules\Document\Models\Document;
use Illuminate\Pagination\LengthAwarePaginator;

interface DocumentRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Document;
    public function findByEmployee(string $employeeId, array $filters): LengthAwarePaginator;
    public function create(array $data): Document;
    public function update(string $id, array $data): Document;
    public function delete(string $id): bool;
}
