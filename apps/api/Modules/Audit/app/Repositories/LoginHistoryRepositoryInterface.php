<?php

declare(strict_types=1);

namespace Modules\Audit\Repositories;

use Modules\Audit\Models\LoginHistory;
use Illuminate\Pagination\LengthAwarePaginator;

interface LoginHistoryRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): LoginHistory;
    public function create(array $data): LoginHistory;
    public function update(string $id, array $data): LoginHistory;
    public function findLatestForUser(string $userId): ?LoginHistory;
    public function hasDeviceBefore(string $userId, string $deviceHash): bool;
}
