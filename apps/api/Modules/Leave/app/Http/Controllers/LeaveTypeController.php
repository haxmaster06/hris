<?php

declare(strict_types=1);

namespace Modules\Leave\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Leave\Http\Requests\LeaveTypeRequest;
use Modules\Leave\Http\Resources\LeaveTypeResource;
use Modules\Leave\Http\Resources\LeaveTypeCollection;
use Modules\Leave\Services\LeaveTypeService;

class LeaveTypeController extends BaseController
{
    public function __construct(
        private readonly LeaveTypeService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('leave_type.read');

        $types = $this->service->list($request->all());

        return $this->successResponse(
            new LeaveTypeCollection($types),
            'Leave types retrieved successfully'
        );
    }

    public function store(LeaveTypeRequest $request): JsonResponse
    {
        Gate::authorize('leave_type.create');

        $type = $this->service->create($request->validated());

        return $this->createdResponse(
            new LeaveTypeResource($type),
            'Leave type created successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('leave_type.read');

        $type = $this->service->findOrFail($id);

        return $this->successResponse(
            new LeaveTypeResource($type),
            'Leave type retrieved successfully'
        );
    }

    public function update(LeaveTypeRequest $request, string $id): JsonResponse
    {
        Gate::authorize('leave_type.update');

        $type = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new LeaveTypeResource($type),
            'Leave type updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('leave_type.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Leave type deleted successfully'
        );
    }
}
