<?php

declare(strict_types=1);

namespace Modules\Certification\Repositories;

use Modules\Certification\Models\CertificationRequirement;
use Illuminate\Pagination\LengthAwarePaginator;

interface CertificationRequirementRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): CertificationRequirement;
    public function create(array $data): CertificationRequirement;
    public function update(string $id, array $data): CertificationRequirement;
    public function delete(string $id): bool;
}
