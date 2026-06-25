<?php

declare(strict_types=1);

namespace Modules\Employee\Repositories;

use Modules\Employee\Models\EmergencyContact;
use Illuminate\Pagination\LengthAwarePaginator;

interface EmergencyContactRepositoryInterface
{
    public function paginate(string $employeeId, int $perPage): LengthAwarePaginator;
    public function findOrFail(string $id): EmergencyContact;
    public function create(array $data): EmergencyContact;
    public function update(string $id, array $data): EmergencyContact;
    public function delete(string $id): bool;
}
