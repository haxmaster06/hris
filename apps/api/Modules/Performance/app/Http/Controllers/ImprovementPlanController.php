<?php

declare(strict_types=1);

namespace Modules\Performance\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Performance\Models\ImprovementPlan;

class ImprovementPlanController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('performance.pip.read');

        $query = ImprovementPlan::query()->with(['employee', 'review', 'supervisor']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        if ($request->has('supervisor_id')) {
            $query->where('supervisor_id', $request->input('supervisor_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $pips = $query->paginate($request->integer('per_page', 15));

        return $this->successResponse($pips, 'Performance improvement plans retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('performance.pip.create');

        $validated = $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'performance_review_id' => 'nullable|uuid|exists:performance_reviews,id',
            'title' => 'required|string|max:255',
            'reason' => 'required|string',
            'action_items' => 'required|array',
            'action_items.*.task' => 'required|string',
            'action_items.*.deadline' => 'required|date',
            'action_items.*.status' => 'required|string|in:pending,completed,failed',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'string|in:active,extended,completed,failed',
            'supervisor_id' => 'required|uuid|exists:employees,id',
            'outcome_notes' => 'nullable|string',
        ]);

        $pip = ImprovementPlan::create($validated);

        return $this->createdResponse($pip, 'Performance improvement plan created successfully.');
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('performance.pip.read');

        $pip = ImprovementPlan::with(['employee', 'review', 'supervisor'])->findOrFail($id);

        return $this->successResponse($pip, 'Performance improvement plan retrieved successfully.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('performance.pip.update');

        $pip = ImprovementPlan::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'reason' => 'required|string',
            'action_items' => 'required|array',
            'action_items.*.task' => 'required|string',
            'action_items.*.deadline' => 'required|date',
            'action_items.*.status' => 'required|string|in:pending,completed,failed',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|string|in:active,extended,completed,failed',
            'supervisor_id' => 'required|uuid|exists:employees,id',
            'outcome_notes' => 'nullable|string',
        ]);

        $pip->update($validated);

        return $this->successResponse($pip, 'Performance improvement plan updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('performance.pip.delete');

        $pip = ImprovementPlan::findOrFail($id);
        $pip->delete();

        return $this->successResponse(null, 'Performance improvement plan deleted successfully.');
    }
}
