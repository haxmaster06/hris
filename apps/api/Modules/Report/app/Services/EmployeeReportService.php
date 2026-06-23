<?php

declare(strict_types=1);

namespace Modules\Report\Services;

use Modules\Employee\Models\Employee;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EmployeeReportService
{
    public function getReportData(array $filters = [], bool $paginate = true)
    {
        $query = Employee::query()
            ->with(['company', 'branch', 'department', 'position']);

        if (!empty($filters['search'])) {
            $query->where(function (Builder $q) use ($filters) {
                $q->where('first_name', 'ilike', "%{$filters['search']}%")
                  ->orWhere('last_name', 'ilike', "%{$filters['search']}%")
                  ->orWhere('employee_number', 'ilike', "%{$filters['search']}%");
            });
        }

        if (!empty($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }

        if (!empty($filters['branch_id'])) {
            $query->where('branch_id', $filters['branch_id']);
        }

        if (!empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        if (!empty($filters['position_id'])) {
            $query->where('position_id', $filters['position_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['gender'])) {
            $query->where('gender', $filters['gender']);
        }

        if (!empty($filters['join_date_start'])) {
            $query->where('join_date', '>=', $filters['join_date_start']);
        }

        if (!empty($filters['join_date_end'])) {
            $query->where('join_date', '<=', $filters['join_date_end']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        if ($paginate) {
            $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;
            return $query->paginate($perPage);
        }

        return $query->get();
    }
}
