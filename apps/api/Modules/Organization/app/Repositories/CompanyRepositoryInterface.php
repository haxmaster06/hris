<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\Company;
use Illuminate\Pagination\LengthAwarePaginator;

interface CompanyRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Company;
    public function create(array $data): Company;
    public function update(string $id, array $data): Company;
    public function delete(string $id): bool;
}
