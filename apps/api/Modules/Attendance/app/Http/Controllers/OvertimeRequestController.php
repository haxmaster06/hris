<?php

declare(strict_types=1);

namespace Modules\Attendance\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Attendance\Models\OvertimeRequest;

class OvertimeRequestController extends BaseController
{
    /**
     * List all overtime requests.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('overtime.view');

        $query = OvertimeRequest::query()->with(['employee', 'approver']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $overtimes = $query->latest('date')->paginate($request->integer('per_page', 15));

        return $this->successResponse($overtimes, 'Overtime requests retrieved successfully.');
    }

    /**
     * Submit new overtime request.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('overtime.create');

        $validated = $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'date' => 'required|date',
            'planned_hours' => 'required|numeric|min:0.5|max:12',
            'actual_hours' => 'nullable|numeric|min:0|max:12',
            'reason' => 'required|string',
        ]);

        $overtime = OvertimeRequest::create($validated);

        return $this->createdResponse($overtime, 'Overtime request submitted successfully.');
    }

    /**
     * View overtime request details.
     */
    public function show(string $id): JsonResponse
    {
        Gate::authorize('overtime.view');

        $overtime = OvertimeRequest::with(['employee', 'approver'])->findOrFail($id);

        return $this->successResponse($overtime, 'Overtime request retrieved successfully.');
    }

    /**
     * Process (approve/reject) overtime request.
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        Gate::authorize('overtime.approve');

        $overtime = OvertimeRequest::findOrFail($id);

        if ($overtime->status !== 'pending') {
            return response()->json(['message' => 'This overtime request is already processed.'], 422);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:approved,rejected',
            'approved_by' => 'required|uuid|exists:employees,id',
            'actual_hours' => 'nullable|numeric|min:0|max:12',
        ]);

        $overtime->update([
            'status' => $validated['status'],
            'approved_by' => $validated['approved_by'],
            'actual_hours' => $validated['actual_hours'] ?? $overtime->actual_hours ?? $overtime->planned_hours,
        ]);

        return $this->successResponse($overtime->fresh(['employee', 'approver']), 'Overtime request processed successfully.');
    }

    /**
     * Delete overtime request.
     */
    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('overtime.approve');

        $overtime = OvertimeRequest::findOrFail($id);
        $overtime->delete();

        return $this->successResponse(null, 'Overtime request deleted successfully.');
    }
}
