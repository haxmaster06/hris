<?php

declare(strict_types=1);

namespace Modules\Report\Services;

use Illuminate\Support\Facades\DB;
use Modules\Employee\Models\Employee;
use Modules\Attendance\Models\AttendanceLog;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class AttendanceReportService
{
    public function getReportData(string $startDate, string $endDate, array $filters = []): array
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        
        $employeeQuery = Employee::query()
            ->with(['department']);

        if (!empty($filters['employee_id'])) {
            $employeeQuery->where('id', $filters['employee_id']);
        }

        if (!empty($filters['department_id'])) {
            $employeeQuery->where('department_id', $filters['department_id']);
        }

        $employees = $employeeQuery->get();

        $logs = AttendanceLog::query()
            ->whereBetween('date', [$startDate, $endDate])
            ->get()
            ->groupBy('employee_id');

        $report = [];

        foreach ($employees as $employee) {
            $empLogs = $logs->get($employee->id) ?? collect();
            
            $presentCount = $empLogs->where('status', 'present')->count();
            $lateCount = $empLogs->where('status', 'late')->count();
            $earlyLeaveCount = $empLogs->where('status', 'early_leave')->count();
            $absentCount = 0; // calculated below

            $totalWorkHours = $empLogs->sum(function ($log) {
                return (float) $log->work_hours;
            });

            // Calculate absent days (days in period with no log)
            $period = CarbonPeriod::create($start, $end);
            foreach ($period as $date) {
                $dateStr = $date->toDateString();
                $hasLog = $empLogs->first(function ($l) use ($dateStr) {
                    // $l->date can be string or Carbon depending on cast
                    $lDate = is_string($l->date) ? $l->date : $l->date?->toDateString();
                    return $lDate === $dateStr;
                });
                if (!$hasLog) {
                    $absentCount++;
                }
            }

            $report[] = [
                'employee_id' => $employee->id,
                'employee_number' => $employee->employee_number,
                'employee_name' => $employee->first_name . ' ' . $employee->last_name,
                'department' => $employee->department?->name ?? 'N/A',
                'summary' => [
                    'present' => $presentCount,
                    'late' => $lateCount,
                    'early_leave' => $earlyLeaveCount,
                    'absent' => $absentCount,
                    'total_days_logged' => $empLogs->count(),
                    'total_work_hours' => round($totalWorkHours, 2),
                ]
            ];
        }

        return $report;
    }
}
