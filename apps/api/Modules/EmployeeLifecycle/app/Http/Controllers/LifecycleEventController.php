<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\EmployeeLifecycle\Http\Requests\CreateLifecycleEventRequest;
use Modules\EmployeeLifecycle\Http\Requests\UpdateLifecycleEventRequest;
use Modules\EmployeeLifecycle\Http\Resources\LifecycleEventCollection;
use Modules\EmployeeLifecycle\Http\Resources\LifecycleEventResource;
use Modules\EmployeeLifecycle\Services\LifecycleEventService;

class LifecycleEventController extends BaseController
{
    public function __construct(
        private readonly LifecycleEventService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('lifecycle_event.view');

        $events = $this->service->list($request->all());

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['employee', 'fromPosition', 'toPosition', 'fromDepartment', 'toDepartment', 'fromBranch', 'toBranch', 'fromDivision', 'toDivision', 'fromGrade', 'toGrade'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations)) {
                    $events->load($relation);
                }
            }
        }

        return $this->successResponse(
            new LifecycleEventCollection($events),
            'Lifecycle events retrieved successfully'
        );
    }

    public function store(CreateLifecycleEventRequest $request): JsonResponse
    {
        Gate::authorize('lifecycle_event.create');

        $event = $this->service->create($request->validated());

        return $this->createdResponse(
            new LifecycleEventResource($event),
            'Lifecycle event created successfully'
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        Gate::authorize('lifecycle_event.view');

        $event = $this->service->findOrFail($id);

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['employee', 'fromPosition', 'toPosition', 'fromDepartment', 'toDepartment', 'fromBranch', 'toBranch', 'fromDivision', 'toDivision', 'fromGrade', 'toGrade'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations)) {
                    $event->load($relation);
                }
            }
        }

        return $this->successResponse(
            new LifecycleEventResource($event),
            'Lifecycle event retrieved successfully'
        );
    }

    public function update(UpdateLifecycleEventRequest $request, string $id): JsonResponse
    {
        Gate::authorize('lifecycle_event.update');

        try {
            $event = $this->service->update($id, $request->validated());

            return $this->successResponse(
                new LifecycleEventResource($event),
                'Lifecycle event updated successfully'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('lifecycle_event.delete');

        try {
            $this->service->delete($id);

            return $this->successResponse(
                null,
                'Lifecycle event deleted successfully'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function execute(string $id): JsonResponse
    {
        Gate::authorize('lifecycle_event.execute');

        try {
            $event = $this->service->execute($id);

            return $this->successResponse(
                new LifecycleEventResource($event),
                'Lifecycle event executed successfully'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
