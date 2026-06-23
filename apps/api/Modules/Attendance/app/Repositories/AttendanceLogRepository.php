<?php

declare(strict_types=1);

namespace Modules\Attendance\Repositories;

use Modules\Attendance\Models\AttendanceLog;
use Illuminate\Pagination\LengthAwarePaginator;

class AttendanceLogRepository implements AttendanceLogRepositoryInterface
{
    public function __construct(
        private readonly AttendanceLog $model
    ) {}

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->query()->with('employee');

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (!empty($filters['date'])) {
            $query->where('date', $filters['date']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $sortBy = $filters['sort_by'] ?? 'date';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findOrFail(string $id): AttendanceLog
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): AttendanceLog
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): AttendanceLog
    {
        $log = $this->findOrFail($id);
        $log->update($data);
        return $log->fresh();
    }

    public function delete(string $id): bool
    {
        $log = $this->findOrFail($id);
        return (bool) $log->delete();
    }

    public function findLogByDate(string $employeeId, string $date): ?AttendanceLog
    {
        return $this->model->query()
            ->where('employee_id', $employeeId)
            ->where('date', $date)
            ->first();
    }
}
