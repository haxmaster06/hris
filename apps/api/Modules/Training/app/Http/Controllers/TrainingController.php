<?php

declare(strict_types=1);

namespace Modules\Training\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Training\Http\Requests\CreateTrainingRequest;
use Modules\Training\Http\Requests\UpdateTrainingRequest;
use Modules\Training\Http\Resources\TrainingResource;
use Modules\Training\Services\TrainingService;

class TrainingController extends BaseController
{
    public function __construct(
        private readonly TrainingService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('training.read');

        $trainings = $this->service->listTrainings($request->all());

        return $this->successResponse(
            TrainingResource::collection($trainings),
            'Trainings retrieved successfully'
        );
    }

    public function store(CreateTrainingRequest $request): JsonResponse
    {
        Gate::authorize('training.create');

        $training = $this->service->createTraining($request->validated());

        return $this->createdResponse(
            new TrainingResource($training),
            'Training created successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('training.read');

        $training = $this->service->findTraining($id);

        return $this->successResponse(
            new TrainingResource($training),
            'Training retrieved successfully'
        );
    }

    public function update(UpdateTrainingRequest $request, string $id): JsonResponse
    {
        Gate::authorize('training.update');

        $training = $this->service->updateTraining($id, $request->validated());

        return $this->successResponse(
            new TrainingResource($training),
            'Training updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('training.delete');

        $this->service->deleteTraining($id);

        return $this->successResponse(
            null,
            'Training deleted successfully'
        );
    }
}
