<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Repositories;

use Modules\EmployeeLifecycle\Models\OnboardingChecklist;
use Illuminate\Pagination\LengthAwarePaginator;

interface OnboardingChecklistRepositoryInterface
{
    public function paginate(string $employeeId, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): OnboardingChecklist;
    public function create(array $data): OnboardingChecklist;
    public function update(string $id, array $data): OnboardingChecklist;
    public function delete(string $id): bool;
}
