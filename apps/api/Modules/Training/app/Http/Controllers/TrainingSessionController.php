<?php

declare(strict_types=1);

namespace Modules\Training\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Training\Http\Requests\CreateTrainingSessionRequest;
use Modules\Training\Http\Requests\UpdateTrainingSessionRequest;
use Modules\Training\Http\Resources\TrainingSessionResource;
use Modules\Training\Services\TrainingService;

class TrainingSessionController extends BaseController
{
    public function __construct(
        private readonly TrainingService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('training.read');

        $sessions = $this->service->listSessions($request->all());

        return $this->successResponse(
            TrainingSessionResource::collection($sessions),
            'Training sessions retrieved successfully'
        );
    }

    public function store(CreateTrainingSessionRequest $request): JsonResponse
    {
        Gate::authorize('training.create');

        $session = $this->service->createSession($request->validated());

        return $this->createdResponse(
            new TrainingSessionResource($session->load('training')),
            'Training session created successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('training.read');

        $session = $this->service->findSession($id);

        return $this->successResponse(
            new TrainingSessionResource($session->load('training')),
            'Training session retrieved successfully'
        );
    }

    public function update(UpdateTrainingSessionRequest $request, string $id): JsonResponse
    {
        Gate::authorize('training.update');

        $session = $this->service->updateSession($id, $request->validated());

        return $this->successResponse(
            new TrainingSessionResource($session->load('training')),
            'Training session updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('training.delete');

        $this->service->deleteSession($id);

        return $this->successResponse(
            null,
            'Training session deleted successfully'
        );
    }
}
