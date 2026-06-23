<?php

declare(strict_types=1);

namespace Modules\Attendance\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Attendance\Http\Requests\CheckInRequest;
use Modules\Attendance\Http\Requests\CheckOutRequest;
use Modules\Attendance\Http\Resources\AttendanceLogResource;
use Modules\Attendance\Http\Resources\AttendanceLogCollection;
use Modules\Attendance\Services\AttendanceService;

class AttendanceController extends BaseController
{
    public function __construct(
        private readonly AttendanceService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('attendance.read');

        $logs = $this->service->list($request->all());

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['employee'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations)) {
                    $logs->load($relation);
                }
            }
        }

        return $this->successResponse(
            new AttendanceLogCollection($logs),
            'Attendance logs retrieved successfully'
        );
    }

    public function checkIn(CheckInRequest $request): JsonResponse
    {
        Gate::authorize('attendance.create');

        $data = $request->validated();
        $ip = $request->ip();

        $log = $this->service->checkIn($data['employee_id'], $data['check_in_time'], $ip);
        $log->load('employee');

        return $this->successResponse(
            new AttendanceLogResource($log),
            'Employee checked in successfully'
        );
    }

    public function checkOut(CheckOutRequest $request): JsonResponse
    {
        Gate::authorize('attendance.create');

        $data = $request->validated();
        $ip = $request->ip();

        $log = $this->service->checkOut($data['employee_id'], $data['check_out_time'], $ip);
        $log->load('employee');

        return $this->successResponse(
            new AttendanceLogResource($log),
            'Employee checked out successfully'
        );
    }
}
