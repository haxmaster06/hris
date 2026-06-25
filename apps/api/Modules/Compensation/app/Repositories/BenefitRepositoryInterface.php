<?php

declare(strict_types=1);

namespace Modules\Compensation\Repositories;

use Modules\Compensation\Models\Benefit;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface BenefitRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function allActive(): Collection;
    public function findOrFail(string $id): Benefit;
    public function create(array $data): Benefit;
    public function update(string $id, array $data): Benefit;
    public function delete(string $id): bool;
}
