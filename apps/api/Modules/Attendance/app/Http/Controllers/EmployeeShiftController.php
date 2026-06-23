<?php

declare(strict_types=1);

namespace Modules\Attendance\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Attendance\Http\Requests\EmployeeShiftRequest;
use Modules\Attendance\Http\Resources\EmployeeShiftResource;
use Modules\Attendance\Http\Resources\EmployeeShiftCollection;
use Modules\Attendance\Services\EmployeeShiftService;

class EmployeeShiftController extends BaseController
{
    public function __construct(
        private readonly EmployeeShiftService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('employee_shift.read');

        $employeeShifts = $this->service->list($request->all());

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['employee', 'shift'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations)) {
                    $employeeShifts->load($relation);
                }
            }
        }

        return $this->successResponse(
            new EmployeeShiftCollection($employeeShifts),
            'Employee shifts retrieved successfully'
        );
    }

    public function store(EmployeeShiftRequest $request): JsonResponse
    {
        Gate::authorize('employee_shift.create');

        $employeeShift = $this->service->create($request->validated());
        $employeeShift->load(['employee', 'shift']);

        return $this->createdResponse(
            new EmployeeShiftResource($employeeShift),
            'Employee shift assigned successfully'
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        Gate::authorize('employee_shift.read');

        $employeeShift = $this->service->findOrFail($id);

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['employee', 'shift'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations)) {
                    $employeeShift->load($relation);
                }
            }
        }

        return $this->successResponse(
            new EmployeeShiftResource($employeeShift),
            'Employee shift retrieved successfully'
        );
    }

    public function update(EmployeeShiftRequest $request, string $id): JsonResponse
    {
        Gate::authorize('employee_shift.update');

        $employeeShift = $this->service->update($id, $request->validated());
        $employeeShift->load(['employee', 'shift']);

        return $this->successResponse(
            new EmployeeShiftResource($employeeShift),
            'Employee shift updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('employee_shift.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Employee shift mapping deleted successfully'
        );
    }
}
