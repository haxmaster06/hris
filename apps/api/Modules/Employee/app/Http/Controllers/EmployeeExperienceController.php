<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Employee\Http\Requests\Experience\CreateExperienceRequest;
use Modules\Employee\Http\Requests\Experience\UpdateExperienceRequest;
use Modules\Employee\Http\Resources\EmployeeExperienceCollection;
use Modules\Employee\Http\Resources\EmployeeExperienceResource;
use Modules\Employee\Services\EmployeeExperienceService;

class EmployeeExperienceController extends BaseController
{
    public function __construct(
        private readonly EmployeeExperienceService $service
    ) {}

    public function index(Request $request, string $employeeId): JsonResponse
    {
        Gate::authorize('employee.read');

        $experience = $this->service->list($employeeId, $request->all());

        return $this->successResponse(
            new EmployeeExperienceCollection($experience),
            'Employee experience records retrieved successfully'
        );
    }

    public function store(CreateExperienceRequest $request, string $employeeId): JsonResponse
    {
        Gate::authorize('employee.update');

        $data = array_merge($request->validated(), ['employee_id' => $employeeId]);
        $experience = $this->service->create($data);

        return $this->createdResponse(
            new EmployeeExperienceResource($experience),
            'Experience record added successfully'
        );
    }

    public function show(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('employee.read');

        $experience = $this->service->findOrFail($id);

        return $this->successResponse(
            new EmployeeExperienceResource($experience),
            'Experience record retrieved successfully'
        );
    }

    public function update(UpdateExperienceRequest $request, string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('employee.update');

        $experience = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new EmployeeExperienceResource($experience),
            'Experience record updated successfully'
        );
    }

    public function destroy(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('employee.update');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Experience record deleted successfully'
        );
    }
}
