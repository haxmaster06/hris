<?php

declare(strict_types=1);

namespace Modules\Recruitment\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Recruitment\Http\Requests\CreateInterviewRequest;
use Modules\Recruitment\Http\Requests\UpdateInterviewRequest;
use Modules\Recruitment\Http\Resources\InterviewCollection;
use Modules\Recruitment\Http\Resources\InterviewResource;
use Modules\Recruitment\Services\InterviewService;

class InterviewController extends BaseController
{
    public function __construct(
        private readonly InterviewService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('recruitment.interview.read');

        $interviews = $this->service->list($request->all());

        return $this->successResponse(
            new InterviewCollection($interviews),
            'Interviews retrieved successfully'
        );
    }

    public function store(CreateInterviewRequest $request): JsonResponse
    {
        Gate::authorize('recruitment.interview.create');

        $interview = $this->service->create($request->validated());

        return $this->createdResponse(
            new InterviewResource($interview),
            'Interview created successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('recruitment.interview.read');

        $interview = $this->service->findOrFail($id);

        return $this->successResponse(
            new InterviewResource($interview),
            'Interview retrieved successfully'
        );
    }

    public function update(UpdateInterviewRequest $request, string $id): JsonResponse
    {
        Gate::authorize('recruitment.interview.update');

        $interview = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new InterviewResource($interview),
            'Interview updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('recruitment.interview.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Interview deleted successfully'
        );
    }

    public function submitResult(Request $request, string $id): JsonResponse
    {
        Gate::authorize('recruitment.interview.update');

        $validated = $request->validate([
            'score' => ['required', 'integer', 'min:1', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $interview = $this->service->submitResult($id, $validated);

        return $this->successResponse(
            new InterviewResource($interview),
            'Interview result submitted successfully'
        );
    }
}
