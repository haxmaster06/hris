<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Employee\Http\Requests\CreateEmployeeRequest;
use Modules\Employee\Http\Requests\UpdateEmployeeRequest;
use Modules\Employee\Http\Resources\EmployeeCollection;
use Modules\Employee\Http\Resources\EmployeeResource;
use Modules\Employee\Services\EmployeeService;

class EmployeeController extends BaseController
{
    public function __construct(
        private readonly EmployeeService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('employee.read');

        $filters = $request->all();
        $user = auth()->user();
        if (!$user->hasRole(['Super Admin', 'HR Admin', 'HR Manager', 'Manager'])) {
            $filters['user_id'] = $user->id;
        }

        $employees = $this->service->list($filters);

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['company', 'branch', 'department', 'position', 'division', 'grade', 'supervisor', 'subordinates', 'emergencyContacts'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations)) {
                    $employees->load($relation);
                }
            }
        }

        return $this->successResponse(
            new EmployeeCollection($employees),
            'Employees retrieved successfully'
        );
    }

    public function store(CreateEmployeeRequest $request): JsonResponse
    {
        Gate::authorize('employee.create');

        $employee = $this->service->create($request->validated());

        return $this->createdResponse(
            new EmployeeResource($employee),
            'Employee created successfully'
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        Gate::authorize('employee.read');

        $employee = $this->service->findOrFail($id);

        $user = auth()->user();
        if (!$user->hasRole(['Super Admin', 'HR Admin', 'HR Manager', 'Manager']) && $employee->user_id !== $user->id) {
            return $this->errorResponse('Access denied', 403);
        }

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['company', 'branch', 'department', 'position', 'division', 'grade', 'supervisor', 'subordinates', 'emergencyContacts'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations)) {
                    $employee->load($relation);
                }
            }
        }

        return $this->successResponse(
            new EmployeeResource($employee),
            'Employee retrieved successfully'
        );
    }

    public function update(UpdateEmployeeRequest $request, string $id): JsonResponse
    {
        Gate::authorize('employee.update');

        $employee = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new EmployeeResource($employee),
            'Employee updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('employee.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Employee deleted successfully'
        );
    }
}
