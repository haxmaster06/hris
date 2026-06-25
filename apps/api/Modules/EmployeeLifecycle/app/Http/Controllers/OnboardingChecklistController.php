<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\EmployeeLifecycle\Http\Requests\CreateOnboardingChecklistRequest;
use Modules\EmployeeLifecycle\Http\Requests\UpdateOnboardingChecklistRequest;
use Modules\EmployeeLifecycle\Http\Resources\OnboardingChecklistCollection;
use Modules\EmployeeLifecycle\Http\Resources\OnboardingChecklistResource;
use Modules\EmployeeLifecycle\Services\OnboardingChecklistService;

class OnboardingChecklistController extends BaseController
{
    public function __construct(
        private readonly OnboardingChecklistService $service
    ) {}

    public function index(Request $request, string $employeeId): JsonResponse
    {
        Gate::authorize('onboarding.view');

        $tasks = $this->service->list($employeeId, $request->all());

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['employee', 'assignedUser'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations)) {
                    $tasks->load($relation);
                }
            }
        }

        return $this->successResponse(
            new OnboardingChecklistCollection($tasks),
            'Onboarding checklist retrieved successfully'
        );
    }

    public function store(CreateOnboardingChecklistRequest $request, string $employeeId): JsonResponse
    {
        Gate::authorize('onboarding.create');

        $data = $request->validated();
        $data['employee_id'] = $employeeId;

        $task = $this->service->create($data);

        return $this->createdResponse(
            new OnboardingChecklistResource($task),
            'Onboarding checklist task created successfully'
        );
    }

    public function show(Request $request, string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('onboarding.view');

        $task = $this->service->findOrFail($id);

        if ($task->employee_id !== $employeeId) {
            return $this->errorResponse('Onboarding task not found for this employee', 404);
        }

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['employee', 'assignedUser'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations)) {
                    $task->load($relation);
                }
            }
        }

        return $this->successResponse(
            new OnboardingChecklistResource($task),
            'Onboarding checklist task retrieved successfully'
        );
    }

    public function update(UpdateOnboardingChecklistRequest $request, string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('onboarding.update');

        $task = $this->service->findOrFail($id);

        if ($task->employee_id !== $employeeId) {
            return $this->errorResponse('Onboarding task not found for this employee', 404);
        }

        $updatedTask = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new OnboardingChecklistResource($updatedTask),
            'Onboarding checklist task updated successfully'
        );
    }

    public function destroy(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('onboarding.delete');

        $task = $this->service->findOrFail($id);

        if ($task->employee_id !== $employeeId) {
            return $this->errorResponse('Onboarding task not found for this employee', 404);
        }

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Onboarding checklist task deleted successfully'
        );
    }

    public function complete(Request $request, string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('onboarding.update');

        $task = $this->service->findOrFail($id);

        if ($task->employee_id !== $employeeId) {
            return $this->errorResponse('Onboarding task not found for this employee', 404);
        }

        $request->validate([
            'is_completed' => ['required', 'boolean']
        ]);

        $updatedTask = $this->service->complete($id, (bool) $request->input('is_completed'));

        return $this->successResponse(
            new OnboardingChecklistResource($updatedTask),
            'Onboarding checklist task completion toggled successfully'
        );
    }
}
