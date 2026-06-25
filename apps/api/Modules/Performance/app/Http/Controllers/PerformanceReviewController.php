<?php

declare(strict_types=1);

namespace Modules\Performance\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Performance\Models\PerformanceReview;
use Modules\Performance\Models\KPIAssignment;
use Modules\Performance\Models\ImprovementPlan;

class PerformanceReviewController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('performance.reviews.read');

        $query = PerformanceReview::query()->with(['employee', 'period', 'manager']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        if ($request->has('manager_id')) {
            $query->where('manager_id', $request->input('manager_id'));
        }

        if ($request->has('performance_period_id')) {
            $query->where('performance_period_id', $request->input('performance_period_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $reviews = $query->paginate($request->integer('per_page', 15));

        return $this->successResponse($reviews, 'Performance reviews retrieved successfully.');
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('performance.reviews.read');

        $review = PerformanceReview::with(['employee', 'period', 'manager', 'improvementPlan'])->findOrFail($id);

        $assignments = KPIAssignment::with('kpi')
            ->where('employee_id', $review->employee_id)
            ->where('performance_period_id', $review->performance_period_id)
            ->get();

        return $this->successResponse([
            'review' => $review,
            'kpi_assignments' => $assignments,
        ], 'Performance review retrieved successfully.');
    }

    public function submitSelfReview(Request $request, string $id): JsonResponse
    {
        Gate::authorize('performance.reviews.update');

        $review = PerformanceReview::findOrFail($id);

        $validated = $request->validate([
            'self_score' => 'required|numeric|min:0|max:100',
            'self_comment' => 'nullable|string',
        ]);

        $review->update(array_merge($validated, [
            'status' => 'manager_review',
        ]));

        return $this->successResponse($review, 'Self-review submitted successfully.');
    }

    public function submitManagerReview(Request $request, string $id): JsonResponse
    {
        Gate::authorize('performance.reviews.update');

        $review = PerformanceReview::findOrFail($id);

        $validated = $request->validate([
            'manager_score' => 'required|numeric|min:0|max:100',
            'manager_comment' => 'nullable|string',
            'manager_id' => 'required|uuid|exists:employees,id',
        ]);

        $assignments = KPIAssignment::where('employee_id', $review->employee_id)
            ->where('performance_period_id', $review->performance_period_id)
            ->get();

        $kpiScore = 0.0;
        foreach ($assignments as $assignment) {
            $kpiScore += ((float) ($assignment->score ?? 0)) * (((float) $assignment->weight) / 100);
        }

        $review->update(array_merge($validated, [
            'kpi_score' => $kpiScore,
            'status' => 'hr_review',
        ]));

        return $this->successResponse($review, 'Manager review submitted successfully.');
    }

    public function submitHRReview(Request $request, string $id): JsonResponse
    {
        Gate::authorize('performance.reviews.update');

        $review = PerformanceReview::with(['employee', 'period'])->findOrFail($id);

        $validated = $request->validate([
            'hr_score' => 'required|numeric|min:0|max:100',
            'hr_comment' => 'nullable|string',
            'hr_reviewer_id' => 'required|uuid|exists:employees,id',
            'final_score' => 'required|numeric|min:0|max:100',
            'rating' => 'required|string|in:exceptional,exceeds,meets,below,unsatisfactory',
            'status' => 'string|in:completed,calibration',
        ]);

        $review->update(array_merge($validated, [
            'status' => $validated['status'] ?? 'completed',
        ]));

        if ($review->status === 'completed' && in_array($review->rating, ['below', 'unsatisfactory'])) {
            $exists = ImprovementPlan::where('performance_review_id', $review->id)->exists();
            if (!$exists) {
                ImprovementPlan::create([
                    'employee_id' => $review->employee_id,
                    'performance_review_id' => $review->id,
                    'title' => 'PIP - ' . ($review->employee->name ?? 'Employee') . ' - ' . ($review->period->name ?? 'Period'),
                    'reason' => 'Appraisal score of ' . $review->final_score . ' with rating: ' . $review->rating,
                    'action_items' => [
                        ['task' => 'Identify core performance gaps', 'deadline' => now()->addDays(14)->toDateString(), 'status' => 'pending'],
                        ['task' => 'Complete required training path', 'deadline' => now()->addDays(30)->toDateString(), 'status' => 'pending']
                    ],
                    'start_date' => now()->toDateString(),
                    'end_date' => now()->addDays(90)->toDateString(),
                    'status' => 'active',
                    'supervisor_id' => $review->manager_id ?? $validated['hr_reviewer_id'],
                ]);
            }
        }

        return $this->successResponse($review, 'HR review completed successfully.');
    }
}
