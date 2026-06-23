<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Employee\Http\Requests\Education\CreateEducationRequest;
use Modules\Employee\Http\Requests\Education\UpdateEducationRequest;
use Modules\Employee\Http\Resources\EmployeeEducationCollection;
use Modules\Employee\Http\Resources\EmployeeEducationResource;
use Modules\Employee\Services\EmployeeEducationService;

class EmployeeEducationController extends BaseController
{
    public function __construct(
        private readonly EmployeeEducationService $service
    ) {}

    public function index(Request $request, string $employeeId): JsonResponse
    {
        Gate::authorize('employee.read');

        $education = $this->service->list($employeeId, $request->all());

        return $this->successResponse(
            new EmployeeEducationCollection($education),
            'Employee education records retrieved successfully'
        );
    }

    public function store(CreateEducationRequest $request, string $employeeId): JsonResponse
    {
        Gate::authorize('employee.update');

        $data = array_merge($request->validated(), ['employee_id' => $employeeId]);
        $education = $this->service->create($data);

        return $this->createdResponse(
            new EmployeeEducationResource($education),
            'Education record added successfully'
        );
    }

    public function show(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('employee.read');

        $education = $this->service->findOrFail($id);

        return $this->successResponse(
            new EmployeeEducationResource($education),
            'Education record retrieved successfully'
        );
    }

    public function update(UpdateEducationRequest $request, string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('employee.update');

        $education = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new EmployeeEducationResource($education),
            'Education record updated successfully'
        );
    }

    public function destroy(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('employee.update');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Education record deleted successfully'
        );
    }
}
