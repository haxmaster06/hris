<?php

declare(strict_types=1);

namespace Modules\Certification\Repositories;

use Modules\Certification\Models\Certification;
use Illuminate\Pagination\LengthAwarePaginator;

interface CertificationRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Certification;
    public function create(array $data): Certification;
    public function update(string $id, array $data): Certification;
    public function delete(string $id): bool;
}
