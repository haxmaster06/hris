<?php

declare(strict_types=1);

namespace Modules\Attendance\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Attendance\Http\Requests\ShiftRequest;
use Modules\Attendance\Http\Resources\ShiftResource;
use Modules\Attendance\Http\Resources\ShiftCollection;
use Modules\Attendance\Services\ShiftService;

class ShiftController extends BaseController
{
    public function __construct(
        private readonly ShiftService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('shift.read');

        $shifts = $this->service->list($request->all());

        return $this->successResponse(
            new ShiftCollection($shifts),
            'Shifts retrieved successfully'
        );
    }

    public function store(ShiftRequest $request): JsonResponse
    {
        Gate::authorize('shift.create');

        $shift = $this->service->create($request->validated());

        return $this->createdResponse(
            new ShiftResource($shift),
            'Shift created successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('shift.read');

        $shift = $this->service->findOrFail($id);

        return $this->successResponse(
            new ShiftResource($shift),
            'Shift retrieved successfully'
        );
    }

    public function update(ShiftRequest $request, string $id): JsonResponse
    {
        Gate::authorize('shift.update');

        $shift = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new ShiftResource($shift),
            'Shift updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('shift.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Shift deleted successfully'
        );
    }
}
