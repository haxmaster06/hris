<?php

declare(strict_types=1);

namespace Modules\Document\Repositories;

use Modules\Document\Models\DocumentCategory;
use Illuminate\Pagination\LengthAwarePaginator;

interface DocumentCategoryRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): DocumentCategory;
    public function findByCode(string $code): ?DocumentCategory;
    public function create(array $data): DocumentCategory;
    public function update(string $id, array $data): DocumentCategory;
    public function delete(string $id): bool;
}
