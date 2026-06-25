<?php

declare(strict_types=1);

namespace Modules\Talent\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Talent\Models\SuccessionPlan;
use Modules\Employee\Models\Employee;

class SuccessionPlanController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('talent.succession.read');

        $query = SuccessionPlan::query()->with(['position', 'incumbent', 'candidate']);

        if ($request->has('position_id')) {
            $query->where('position_id', $request->input('position_id'));
        }

        if ($request->has('candidate_employee_id')) {
            $query->where('candidate_employee_id', $request->input('candidate_employee_id'));
        }

        $plans = $query->paginate($request->integer('per_page', 25));

        return $this->successResponse($plans, 'Succession plans retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('talent.succession.create');

        $validated = $request->validate([
            'position_id' => 'required|uuid|exists:positions,id',
            'incumbent_employee_id' => 'nullable|uuid|exists:employees,id',
            'candidate_employee_id' => 'required|uuid|exists:employees,id|different:incumbent_employee_id',
            'readiness_level' => 'required|string|in:ready_now,ready_1_year,ready_2_years,development_needed',
            'potential_score' => 'required|numeric|min:0|max:100',
            'performance_score' => 'required|numeric|min:0|max:100',
            'development_actions' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $plan = SuccessionPlan::create($validated);

        return $this->createdResponse($plan->load(['position', 'incumbent', 'candidate']), 'Succession plan created successfully.');
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('talent.succession.read');

        $plan = SuccessionPlan::with(['position', 'incumbent', 'candidate'])->findOrFail($id);

        return $this->successResponse($plan, 'Succession plan retrieved successfully.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('talent.succession.update');

        $plan = SuccessionPlan::findOrFail($id);

        $validated = $request->validate([
            'position_id' => 'required|uuid|exists:positions,id',
            'incumbent_employee_id' => 'nullable|uuid|exists:employees,id',
            'candidate_employee_id' => 'required|uuid|exists:employees,id|different:incumbent_employee_id',
            'readiness_level' => 'required|string|in:ready_now,ready_1_year,ready_2_years,development_needed',
            'potential_score' => 'required|numeric|min:0|max:100',
            'performance_score' => 'required|numeric|min:0|max:100',
            'development_actions' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $plan->update($validated);

        return $this->successResponse($plan->load(['position', 'incumbent', 'candidate']), 'Succession plan updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('talent.succession.delete');

        $plan = SuccessionPlan::findOrFail($id);
        $plan->delete();

        return $this->successResponse(null, 'Succession plan deleted successfully.');
    }

    public function nineBoxGrid(Request $request): JsonResponse
    {
        Gate::authorize('talent.succession.read');

        $plans = SuccessionPlan::with(['candidate', 'position'])->get();

        $grid = [
            'high_high' => [],
            'high_med' => [],
            'high_low' => [],
            'med_high' => [],
            'med_med' => [],
            'med_low' => [],
            'low_high' => [],
            'low_med' => [],
            'low_low' => [],
        ];

        foreach ($plans as $plan) {
            $perf = (float) $plan->performance_score;
            $pot = (float) $plan->potential_score;

            $perfLevel = $perf < 40 ? 'low' : ($perf <= 75 ? 'med' : 'high');
            $potLevel = $pot < 40 ? 'low' : ($pot <= 75 ? 'med' : 'high');

            $key = "{$potLevel}_{$perfLevel}";
            if (array_key_exists($key, $grid)) {
                $grid[$key][] = [
                    'id' => $plan->id,
                    'candidate_id' => $plan->candidate_employee_id,
                    'candidate_name' => $plan->candidate->name ?? 'Unknown',
                    'position_name' => $plan->position->name ?? 'Unknown',
                    'readiness_level' => $plan->readiness_level,
                    'performance_score' => $perf,
                    'potential_score' => $pot,
                ];
            }
        }

        return $this->successResponse($grid, '9-box grid data compiled successfully.');
    }
}
