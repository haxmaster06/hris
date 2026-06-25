<?php

declare(strict_types=1);

namespace Modules\Organization\Repositories;

use Modules\Organization\Models\CostCenter;
use Illuminate\Pagination\LengthAwarePaginator;

interface CostCenterRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): CostCenter;
    public function create(array $data): CostCenter;
    public function update(string $id, array $data): CostCenter;
    public function delete(string $id): bool;
}
