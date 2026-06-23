<?php

declare(strict_types=1);

namespace Modules\Report\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Report\Services\EmployeeReportService;
use Modules\Report\Services\AttendanceReportService;
use Modules\Report\Services\LeaveReportService;
use Modules\Employee\Http\Resources\EmployeeCollection;
use Modules\Employee\Http\Resources\EmployeeResource;

class ReportController extends BaseController
{
    public function __construct(
        private readonly EmployeeReportService $employeeReportService,
        private readonly AttendanceReportService $attendanceReportService,
        private readonly LeaveReportService $leaveReportService
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
}
