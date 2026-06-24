<?php

declare(strict_types=1);

namespace Modules\Recruitment\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Recruitment\Http\Requests\CreateJobApplicationRequest;
use Modules\Recruitment\Http\Requests\UpdateJobApplicationRequest;
use Modules\Recruitment\Http\Resources\JobApplicationCollection;
use Modules\Recruitment\Http\Resources\JobApplicationResource;
use Modules\Recruitment\Services\JobApplicationService;

class JobApplicationController extends BaseController
{
    public function __construct(
        private readonly JobApplicationService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('recruitment.application.read');

        $applications = $this->service->list($request->all());

        return $this->successResponse(
            new JobApplicationCollection($applications),
            'Job applications retrieved successfully'
        );
    }

    public function store(CreateJobApplicationRequest $request): JsonResponse
    {
        Gate::authorize('recruitment.application.create');

        $application = $this->service->create($request->validated());

        return $this->createdResponse(
            new JobApplicationResource($application),
            'Job application created successfully'
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        Gate::authorize('recruitment.application.read');

        $application = $this->service->findOrFail($id);

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['vacancy', 'candidate', 'interviews', 'approvals'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations, true)) {
                    $application->load($relation);
                }
            }
        }

        return $this->successResponse(
            new JobApplicationResource($application),
            'Job application retrieved successfully'
        );
    }

    public function update(UpdateJobApplicationRequest $request, string $id): JsonResponse
    {
        Gate::authorize('recruitment.application.update');

        $application = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new JobApplicationResource($application),
            'Job application updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('recruitment.application.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Job application deleted successfully'
        );
    }

    public function moveStage(Request $request, string $id): JsonResponse
    {
        Gate::authorize('recruitment.application.update');

        $request->validate([
            'status' => ['required', 'string', 'in:applied,screening,interview,assessment,offering,hiring,hired,rejected'],
        ]);

        $application = $this->service->moveStage($id, $request->input('status'));

        return $this->successResponse(
            new JobApplicationResource($application),
            'Job application stage updated successfully'
        );
    }
}
