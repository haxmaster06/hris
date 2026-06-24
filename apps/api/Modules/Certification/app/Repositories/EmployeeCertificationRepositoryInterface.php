<?php

declare(strict_types=1);

namespace Modules\Certification\Repositories;

use Modules\Certification\Models\EmployeeCertification;
use Illuminate\Pagination\LengthAwarePaginator;

interface EmployeeCertificationRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): EmployeeCertification;
    public function create(array $data): EmployeeCertification;
    public function update(string $id, array $data): EmployeeCertification;
    public function delete(string $id): bool;
}
