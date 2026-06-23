<?php

declare(strict_types=1);

namespace Modules\Report\Services;

use Modules\Employee\Models\Employee;
use Modules\Leave\Models\LeaveBalance;
use Modules\Leave\Models\LeaveRequest;

class LeaveReportService
{
    public function getReportData(int $year, array $filters = []): array
    {
        $employeeQuery = Employee::query()
            ->with(['department']);

        if (!empty($filters['employee_id'])) {
            $employeeQuery->where('id', $filters['employee_id']);
        }

        if (!empty($filters['department_id'])) {
            $employeeQuery->where('department_id', $filters['department_id']);
        }

        $employees = $employeeQuery->get();

        $balances = LeaveBalance::query()
            ->with(['leaveType'])
            ->where('year', $year)
            ->get()
            ->groupBy('employee_id');

        $requests = LeaveRequest::query()
            ->whereYear('start_date', $year)
            ->get()
            ->groupBy('employee_id');

        $report = [];

        foreach ($employees as $employee) {
            $empBalances = $balances->get($employee->id) ?? collect();
            $empRequests = $requests->get($employee->id) ?? collect();

            $balanceSummary = [];
            foreach ($empBalances as $balance) {
                $balanceSummary[] = [
                    'leave_type' => $balance->leaveType?->name ?? 'N/A',
                    'code' => $balance->leaveType?->code ?? 'N/A',
                    'allocated' => (int) $balance->entitled,
                    'used' => (int) $balance->used,
                    'remaining' => (int) $balance->remaining,
                ];
            }

            $report[] = [
                'employee_id' => $employee->id,
                'employee_number' => $employee->employee_number,
                'employee_name' => $employee->first_name . ' ' . $employee->last_name,
                'department' => $employee->department?->name ?? 'N/A',
                'balances' => $balanceSummary,
                'requests_summary' => [
                    'pending' => $empRequests->where('status', 'pending')->count(),
                    'approved' => $empRequests->where('status', 'approved')->count(),
                    'rejected' => $empRequests->where('status', 'rejected')->count(),
                    'total' => $empRequests->count(),
                ]
            ];
        }

        return $report;
    }
}
