<?php

declare(strict_types=1);

namespace Modules\Compensation\Repositories;

use Modules\Compensation\Models\BonusScheme;
use Illuminate\Pagination\LengthAwarePaginator;

interface BonusSchemeRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): BonusScheme;
    public function create(array $data): BonusScheme;
    public function update(string $id, array $data): BonusScheme;
    public function delete(string $id): bool;
}
