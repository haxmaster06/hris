<?php

declare(strict_types=1);

namespace Modules\Audit\Repositories;

use Modules\Audit\Models\AuditLog;
use Illuminate\Pagination\LengthAwarePaginator;

interface AuditLogRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): AuditLog;
    public function create(array $data): AuditLog;
}
