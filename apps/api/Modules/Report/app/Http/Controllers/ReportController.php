<?php

declare(strict_types=1);

namespace Modules\Report\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Report\Services\EmployeeReportService;
use Modules\Report\Services\AttendanceReportService;
use Modules\Report\Services\LeaveReportService;
use Modules\Report\Services\ReportService;
use Modules\Employee\Http\Resources\EmployeeCollection;
use Modules\Employee\Http\Resources\EmployeeResource;
use Modules\Payroll\Models\PayrollRun;

class ReportController extends BaseController
{
    public function __construct(
        private readonly EmployeeReportService $employeeReportService,
        private readonly AttendanceReportService $attendanceReportService,
        private readonly LeaveReportService $leaveReportService,
        private readonly ReportService $reportService
    ) {}

    public function employees(Request $request): JsonResponse
    {
        $export = $request->boolean('export', false);
        $employees = $this->employeeReportService->getReportData($request->all(), !$export);

        if ($export) {
            return $this->successResponse(
                EmployeeResource::collection($employees)
            );
        }

        return $this->successResponse(
            new EmployeeCollection($employees)
        );
    }

    public function attendance(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => ['required', 'date', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'employee_id' => ['nullable', 'uuid'],
            'department_id' => ['nullable', 'uuid'],
        ]);

        $report = $this->attendanceReportService->getReportData(
            startDate: $request->start_date,
            endDate: $request->end_date,
            filters: $request->only(['employee_id', 'department_id'])
        );

        return $this->successResponse($report);
    }

    public function leave(Request $request): JsonResponse
    {
        $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'employee_id' => ['nullable', 'uuid'],
            'department_id' => ['nullable', 'uuid'],
        ]);

        $report = $this->leaveReportService->getReportData(
            year: (int) $request->year,
            filters: $request->only(['employee_id', 'department_id'])
        );

        return $this->successResponse($report);
    }

    public function payroll(Request $request): JsonResponse
    {
        $request->validate([
            'payroll_period_id' => ['nullable', 'uuid'],
        ]);

        $periodId = $request->payroll_period_id;
        if (!$periodId) {
            $latestPeriod = \Modules\Payroll\Models\PayrollPeriod::orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->first();
            $periodId = $latestPeriod?->id;
        }

        if (!$periodId) {
            return $this->successResponse([]);
        }

        $runs = PayrollRun::with(['employee.department'])
            ->where('payroll_period_id', $periodId)
            ->get()
            ->groupBy('employee.department.name')
            ->map(fn($group) => [
                'department' => $group->first()->employee->department->name ?? 'Unknown',
                'cost' => $group->sum('take_home_pay'),
            ])->values();

        return $this->successResponse($runs);
    }

    public function turnover(Request $request): JsonResponse
    {
        $year = (int) $request->input('year', date('Y'));
        return $this->successResponse($this->reportService->turnoverReport($year));
    }

    public function retention(Request $request): JsonResponse
    {
        $year = (int) $request->input('year', date('Y'));
        return $this->successResponse($this->reportService->retentionReport($year));
    }

    public function headcount(Request $request): JsonResponse
    {
        return $this->successResponse($this->reportService->headcountReport());
    }

    public function workforceSummary(Request $request): JsonResponse
    {
        return $this->successResponse($this->reportService->workforceSummary());
    }

    public function costAnalysis(Request $request): JsonResponse
    {
        $year = (int) $request->input('year', date('Y'));
        return $this->successResponse($this->reportService->costAnalysis($year));
    }

    public function trainingEffectiveness(Request $request): JsonResponse
    {
        return $this->successResponse($this->reportService->trainingEffectiveness());
    }
}

