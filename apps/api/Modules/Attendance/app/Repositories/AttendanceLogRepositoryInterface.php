<?php

declare(strict_types=1);

namespace Modules\Attendance\Repositories;

use Modules\Attendance\Models\AttendanceLog;
use Illuminate\Pagination\LengthAwarePaginator;

interface AttendanceLogRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): AttendanceLog;
    public function create(array $data): AttendanceLog;
    public function update(string $id, array $data): AttendanceLog;
    public function delete(string $id): bool;
    public function findLogByDate(string $employeeId, string $date): ?AttendanceLog;
}
