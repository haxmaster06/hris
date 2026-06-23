<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Employee\Http\Requests\Family\CreateFamilyRequest;
use Modules\Employee\Http\Requests\Family\UpdateFamilyRequest;
use Modules\Employee\Http\Resources\EmployeeFamilyCollection;
use Modules\Employee\Http\Resources\EmployeeFamilyResource;
use Modules\Employee\Services\EmployeeFamilyService;

class EmployeeFamilyController extends BaseController
{
    public function __construct(
        private readonly EmployeeFamilyService $service
    ) {}

    public function index(Request $request, string $employeeId): JsonResponse
    {
        Gate::authorize('employee.read');

        $family = $this->service->list($employeeId, $request->all());

        return $this->successResponse(
            new EmployeeFamilyCollection($family),
            'Employee family members retrieved successfully'
        );
    }

    public function store(CreateFamilyRequest $request, string $employeeId): JsonResponse
    {
        Gate::authorize('employee.update');

        $data = array_merge($request->validated(), ['employee_id' => $employeeId]);
        $family = $this->service->create($data);

        return $this->createdResponse(
            new EmployeeFamilyResource($family),
            'Family member added successfully'
        );
    }

    public function show(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('employee.read');

        $family = $this->service->findOrFail($id);

        return $this->successResponse(
            new EmployeeFamilyResource($family),
            'Family member retrieved successfully'
        );
    }

    public function update(UpdateFamilyRequest $request, string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('employee.update');

        $family = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new EmployeeFamilyResource($family),
            'Family member updated successfully'
        );
    }

    public function destroy(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('employee.update');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Family member deleted successfully'
        );
    }
}
