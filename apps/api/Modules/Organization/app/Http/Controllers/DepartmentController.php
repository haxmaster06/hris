<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Organization\Http\Requests\Department\CreateDepartmentRequest;
use Modules\Organization\Http\Requests\Department\UpdateDepartmentRequest;
use Modules\Organization\Http\Resources\DepartmentCollection;
use Modules\Organization\Http\Resources\DepartmentResource;
use Modules\Organization\Services\DepartmentService;

class DepartmentController extends BaseController
{
    public function __construct(
        private readonly DepartmentService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('organization.departments.read');

        $departments = $this->service->list($request->all());

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            if (in_array('branch', $includes)) {
                $departments->load('branch');
            }
            if (in_array('parent', $includes)) {
                $departments->load('parent');
            }
        }

        return $this->successResponse(
            new DepartmentCollection($departments),
            'Departments retrieved successfully'
        );
    }

    public function store(CreateDepartmentRequest $request): JsonResponse
    {
        Gate::authorize('organization.departments.create');

        $department = $this->service->create($request->validated());

        return $this->createdResponse(
            new DepartmentResource($department),
            'Department created successfully'
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        Gate::authorize('organization.departments.read');

        $department = $this->service->findOrFail($id);

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            if (in_array('branch', $includes)) {
                $department->load('branch');
            }
            if (in_array('parent', $includes)) {
                $department->load('parent');
            }
        }

        return $this->successResponse(
            new DepartmentResource($department),
            'Department retrieved successfully'
        );
    }

    public function update(UpdateDepartmentRequest $request, string $id): JsonResponse
    {
        Gate::authorize('organization.departments.update');

        $department = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new DepartmentResource($department),
            'Department updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('organization.departments.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Department deleted successfully'
        );
    }
}
