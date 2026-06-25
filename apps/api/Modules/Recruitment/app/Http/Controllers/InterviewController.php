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
use Modules\Recruitment\Models\Interview;
use Modules\Recruitment\Models\InterviewEvaluation;
use Illuminate\Support\Facades\DB;

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

    public function submitEvaluation(Request $request, string $id): JsonResponse
    {
        Gate::authorize('recruitment.interview.update');

        $interview = Interview::findOrFail($id);

        $validated = $request->validate([
            'evaluator_id' => ['required', 'uuid', 'exists:employees,id'],
            'criteria' => ['required', 'array'],
            'overall_score' => ['required', 'numeric', 'min:1', 'max:5'],
            'recommendation' => ['required', 'string', 'in:hire,reject,next_round'],
            'comments' => ['nullable', 'string'],
        ]);

        $evaluation = DB::transaction(function () use ($id, $validated, $interview) {
            $eval = InterviewEvaluation::updateOrCreate(
                ['interview_id' => $id],
                [
                    'evaluator_id' => $validated['evaluator_id'],
                    'criteria' => $validated['criteria'],
                    'overall_score' => $validated['overall_score'],
                    'recommendation' => $validated['recommendation'],
                    'comments' => $validated['comments'] ?? null,
                ]
            );

            // Map 1-5 overall score to 1-100 rating
            $interview->update([
                'score' => (int) ($validated['overall_score'] * 20),
                'status' => 'completed',
            ]);

            return $eval;
        });

        return $this->successResponse(
            new InterviewResource($interview->load('evaluation')),
            'Interview evaluation submitted successfully'
        );
    }
}
