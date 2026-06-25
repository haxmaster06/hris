<?php

declare(strict_types=1);

namespace Modules\Engagement\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Modules\Engagement\Models\Survey;
use Modules\Engagement\Models\SurveyQuestion;

class SurveyController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('survey.view');

        $query = Survey::query()->with('questions');

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        $surveys = $query->paginate($request->integer('per_page', 15));

        return $this->successResponse($surveys, 'Surveys retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('survey.create');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:satisfaction,pulse,engagement,custom',
            'status' => 'string|in:draft,published,closed,archived',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_anonymous' => 'boolean',
            'target_audience' => 'string|in:all,department,position,custom',
            'target_ids' => 'nullable|array',
            'questions' => 'nullable|array',
            'questions.*.question' => 'required|string',
            'questions.*.type' => 'required|string|in:scale_1_5,scale_1_10,text,single_choice,multiple_choice',
            'questions.*.options' => 'nullable|array',
            'questions.*.is_required' => 'boolean',
            'questions.*.sort_order' => 'integer',
        ]);

        $survey = DB::transaction(function () use ($validated) {
            $surveyData = collect($validated)->except('questions')->toArray();
            $survey = Survey::create($surveyData);

            if (!empty($validated['questions'])) {
                foreach ($validated['questions'] as $qData) {
                    $survey->questions()->create($qData);
                }
            }

            return $survey;
        });

        return $this->createdResponse($survey->load('questions'), 'Survey created successfully.');
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('survey.view');

        $survey = Survey::with('questions')->findOrFail($id);

        return $this->successResponse($survey, 'Survey retrieved successfully.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('survey.update');

        $survey = Survey::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:satisfaction,pulse,engagement,custom',
            'status' => 'required|string|in:draft,published,closed,archived',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_anonymous' => 'boolean',
            'target_audience' => 'required|string|in:all,department,position,custom',
            'target_ids' => 'nullable|array',
            'questions' => 'nullable|array',
            'questions.*.id' => 'nullable|uuid',
            'questions.*.question' => 'required|string',
            'questions.*.type' => 'required|string|in:scale_1_5,scale_1_10,text,single_choice,multiple_choice',
            'questions.*.options' => 'nullable|array',
            'questions.*.is_required' => 'boolean',
            'questions.*.sort_order' => 'integer',
        ]);

        DB::transaction(function () use ($survey, $validated) {
            $surveyData = collect($validated)->except('questions')->toArray();
            $survey->update($surveyData);

            if (isset($validated['questions'])) {
                $incomingIds = collect($validated['questions'])->pluck('id')->filter()->toArray();
                $survey->questions()->whereNotIn('id', $incomingIds)->delete();

                foreach ($validated['questions'] as $qData) {
                    if (!empty($qData['id'])) {
                        $question = SurveyQuestion::findOrFail($qData['id']);
                        $question->update($qData);
                    } else {
                        $survey->questions()->create($qData);
                    }
                }
            }
        });

        return $this->successResponse($survey->load('questions'), 'Survey updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('survey.delete');

        $survey = Survey::findOrFail($id);
        $survey->delete();

        return $this->successResponse(null, 'Survey deleted successfully.');
    }
}
