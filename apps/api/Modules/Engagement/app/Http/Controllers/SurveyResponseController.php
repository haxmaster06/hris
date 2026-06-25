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
use Modules\Engagement\Models\SurveyResponse;
use Modules\Engagement\Models\SurveyAnswer;
use Carbon\Carbon;

class SurveyResponseController extends BaseController
{
    /**
     * Submit response to a survey.
     */
    public function store(Request $request, string $id): JsonResponse
    {
        Gate::authorize('survey.respond');

        $survey = Survey::with('questions')->findOrFail($id);

        if ($survey->status !== 'published') {
            return response()->json(['message' => 'Survey is not active.'], 422);
        }

        $validated = $request->validate([
            'employee_id' => 'nullable|uuid|exists:employees,id',
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|uuid|exists:survey_questions,id',
            'answers.*.answer_text' => 'nullable|string',
            'answers.*.answer_choices' => 'nullable|array',
        ]);

        $response = DB::transaction(function () use ($survey, $validated) {
            // Anonymous check
            $employeeId = $survey->is_anonymous ? null : ($validated['employee_id'] ?? auth()->user()?->employee_id);
            
            $response = SurveyResponse::create([
                'survey_id' => $survey->id,
                'employee_id' => $employeeId,
                'submitted_at' => Carbon::now(),
            ]);

            foreach ($validated['answers'] as $ansData) {
                $response->answers()->create([
                    'survey_question_id' => $ansData['question_id'],
                    'answer_text' => $ansData['answer_text'] ?? null,
                    'answer_choices' => $ansData['answer_choices'] ?? null,
                ]);
            }

            return $response;
        });

        return $this->createdResponse($response->load('answers'), 'Survey response submitted successfully.');
    }

    /**
     * Get aggregate analytics of survey questions.
     */
    public function analytics(string $id): JsonResponse
    {
        Gate::authorize('survey.view');

        $survey = Survey::with('questions')->findOrFail($id);
        $totalResponses = SurveyResponse::where('survey_id', $id)->count();

        $analytics = [];

        foreach ($survey->questions as $question) {
            $answers = SurveyAnswer::where('survey_question_id', $question->id)->get();
            $questionData = [
                'id' => $question->id,
                'question' => $question->question,
                'type' => $question->type,
                'total_responses' => $answers->count(),
            ];

            if ($question->type === 'scale_1_5' || $question->type === 'scale_1_10') {
                $scores = $answers->pluck('answer_text')->map(fn($val) => (float) $val)->filter();
                $avg = $scores->avg() ?? 0.0;
                $questionData['average'] = round($avg, 2);
                $questionData['min'] = $scores->min() ?? 0;
                $questionData['max'] = $scores->max() ?? 0;
                
                // Distribution of scores
                $dist = [];
                $maxVal = $question->type === 'scale_1_5' ? 5 : 10;
                for ($i = 1; $i <= $maxVal; $i++) {
                    $dist[$i] = $scores->filter(fn($val) => $val == $i)->count();
                }
                $questionData['distribution'] = $dist;
            } elseif ($question->type === 'single_choice' || $question->type === 'multiple_choice') {
                $distribution = [];
                $options = $question->options ?? [];
                foreach ($options as $opt) {
                    $distribution[$opt] = 0;
                }

                foreach ($answers as $ans) {
                    if ($question->type === 'single_choice') {
                        $txt = $ans->answer_text;
                        if ($txt && isset($distribution[$txt])) {
                            $distribution[$txt]++;
                        }
                    } else {
                        $choices = $ans->answer_choices ?? [];
                        foreach ($choices as $ch) {
                            if (isset($distribution[$ch])) {
                                $distribution[$ch]++;
                            }
                        }
                    }
                }
                $questionData['distribution'] = $distribution;
            } else {
                // Text answers
                $questionData['recent_answers'] = $answers->pluck('answer_text')->filter()->take(10)->values()->toArray();
            }

            $analytics[] = $questionData;
        }

        return $this->successResponse([
            'survey' => $survey,
            'total_responses' => $totalResponses,
            'analytics' => $analytics,
        ], 'Survey analytics retrieved successfully.');
    }
}
