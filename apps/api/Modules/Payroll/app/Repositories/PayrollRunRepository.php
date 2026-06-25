<?php

declare(strict_types=1);

namespace Modules\Payroll\Repositories;

use Modules\Payroll\Models\PayrollRun;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class PayrollRunRepository implements PayrollRunRepositoryInterface
{
    public function __construct(
        private readonly PayrollRun $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query()->with(['employee', 'payrollPeriod']);

        if (!empty($filters['payroll_period_id'])) {
            $query->where('payroll_period_id', $filters['payroll_period_id']);
        }

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (!empty($filters['search'])) {
            $query->whereHas('employee', function($q) use ($filters) {
                $q->where('first_name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('last_name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('employee_code', 'like', '%' . $filters['search'] . '%');
            });
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('take_home_pay', 'desc')
            ->paginate($perPage);
    }

    public function findOrFail(string $id): PayrollRun
    {
        return $this->model->with('payrollRunDetails')->findOrFail($id);
    }

    public function findForEmployeeAndPeriod(string $employeeId, string $periodId): ?PayrollRun
    {
        return $this->model->where('employee_id', $employeeId)
            ->where('payroll_period_id', $periodId)
            ->with('payrollRunDetails')
            ->first();
    }

    public function findForPeriod(string $periodId): Collection
    {
        return $this->model->where('payroll_period_id', $periodId)
            ->with('payrollRunDetails')
            ->get();
    }

    public function createOrUpdate(array $keys, array $data): PayrollRun
    {
        return $this->model->updateOrCreate($keys, $data);
    }

    public function deleteForPeriod(string $periodId): bool
    {
        return (bool) $this->model->where('payroll_period_id', $periodId)->delete();
    }
}
