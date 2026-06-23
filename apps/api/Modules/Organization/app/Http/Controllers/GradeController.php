<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Organization\Http\Requests\Grade\CreateGradeRequest;
use Modules\Organization\Http\Requests\Grade\UpdateGradeRequest;
use Modules\Organization\Http\Resources\GradeCollection;
use Modules\Organization\Http\Resources\GradeResource;
use Modules\Organization\Services\GradeService;

class GradeController extends BaseController
{
    public function __construct(
        private readonly GradeService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('organization.grades.read');

        $grades = $this->service->list($request->all());

        return $this->successResponse(
            new GradeCollection($grades),
            'Grades retrieved successfully'
        );
    }

    public function store(CreateGradeRequest $request): JsonResponse
    {
        Gate::authorize('organization.grades.create');

        $grade = $this->service->create($request->validated());

        return $this->createdResponse(
            new GradeResource($grade),
            'Grade created successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('organization.grades.read');

        $grade = $this->service->findOrFail($id);

        return $this->successResponse(
            new GradeResource($grade),
            'Grade retrieved successfully'
        );
    }

    public function update(UpdateGradeRequest $request, string $id): JsonResponse
    {
        Gate::authorize('organization.grades.update');

        $grade = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new GradeResource($grade),
            'Grade updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('organization.grades.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Grade deleted successfully'
        );
    }
}
