<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Employee\Http\Requests\CreateEmergencyContactRequest;
use Modules\Employee\Http\Requests\UpdateEmergencyContactRequest;
use Modules\Employee\Http\Resources\EmergencyContactResource;
use Modules\Employee\Services\EmergencyContactService;

class EmergencyContactController extends BaseController
{
    public function __construct(
        private readonly EmergencyContactService $service
    ) {}

    public function index(Request $request, string $employeeId): JsonResponse
    {
        Gate::authorize('employee.read');

        $contacts = $this->service->list($employeeId, $request->all());

        return $this->successResponse(
            EmergencyContactResource::collection($contacts),
            'Emergency contacts retrieved successfully'
        );
    }

    public function store(CreateEmergencyContactRequest $request, string $employeeId): JsonResponse
    {
        Gate::authorize('employee.update');

        $data = $request->validated();
        $data['employee_id'] = $employeeId;

        $contact = $this->service->create($data);

        return $this->createdResponse(
            new EmergencyContactResource($contact),
            'Emergency contact created successfully'
        );
    }

    public function show(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('employee.read');

        $contact = $this->service->findOrFail($id);

        if ($contact->employee_id !== $employeeId) {
            return $this->errorResponse('Emergency contact not found for this employee', 404);
        }

        return $this->successResponse(
            new EmergencyContactResource($contact),
            'Emergency contact retrieved successfully'
        );
    }

    public function update(UpdateEmergencyContactRequest $request, string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('employee.update');

        $contact = $this->service->findOrFail($id);

        if ($contact->employee_id !== $employeeId) {
            return $this->errorResponse('Emergency contact not found for this employee', 404);
        }

        $updatedContact = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new EmergencyContactResource($updatedContact),
            'Emergency contact updated successfully'
        );
    }

    public function destroy(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('employee.update');

        $contact = $this->service->findOrFail($id);

        if ($contact->employee_id !== $employeeId) {
            return $this->errorResponse('Emergency contact not found for this employee', 404);
        }

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Emergency contact deleted successfully'
        );
    }
}
