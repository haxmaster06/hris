<?php

declare(strict_types=1);

namespace Modules\Compensation\Repositories;

use Modules\Compensation\Models\Claim;
use Illuminate\Pagination\LengthAwarePaginator;

interface ClaimRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Claim;
    public function create(array $data): Claim;
    public function update(string $id, array $data): Claim;
    public function delete(string $id): bool;
}
