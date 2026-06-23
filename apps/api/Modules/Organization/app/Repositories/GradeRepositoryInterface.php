<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\Grade;
use Illuminate\Pagination\LengthAwarePaginator;

interface GradeRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Grade;
    public function create(array $data): Grade;
    public function update(string $id, array $data): Grade;
    public function delete(string $id): bool;
}
