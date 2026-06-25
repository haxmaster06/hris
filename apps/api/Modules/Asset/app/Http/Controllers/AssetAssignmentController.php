<?php

declare(strict_types=1);

namespace Modules\Asset\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Modules\Asset\Models\Asset;
use Modules\Asset\Models\AssetAssignment;
use Carbon\Carbon;

class AssetAssignmentController extends BaseController
{
    /**
     * List all assignments.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('asset_assignment.view');

        $query = AssetAssignment::query()->with(['asset', 'employee', 'assigner']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        if ($request->has('asset_id')) {
            $query->where('asset_id', $request->input('asset_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $assignments = $query->latest('assigned_date')->paginate($request->integer('per_page', 15));

        return $this->successResponse($assignments, 'Asset assignments retrieved successfully.');
    }

    /**
     * Assign asset to employee.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('asset_assignment.create');

        $validated = $request->validate([
            'asset_id' => 'required|uuid|exists:assets,id',
            'employee_id' => 'required|uuid|exists:employees,id',
            'assigned_date' => 'required|date',
            'expected_return_date' => 'nullable|date|after_or_equal:assigned_date',
            'condition_on_assign' => 'required|string|in:new,good,fair,poor,damaged',
            'assign_notes' => 'nullable|string',
            'bast_document_path' => 'nullable|string|max:255',
            'assigned_by' => 'required|uuid|exists:employees,id',
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);

        if ($asset->status !== 'available') {
            return response()->json(['message' => 'Asset is not available for assignment.'], 422);
        }

        $assignment = DB::transaction(function () use ($asset, $validated) {
            // Update asset status
            $asset->update([
                'status' => 'assigned',
                'condition' => $validated['condition_on_assign'],
            ]);

            // Create assignment
            return AssetAssignment::create($validated);
        });

        return $this->createdResponse($assignment->load(['asset', 'employee']), 'Asset assigned successfully.');
    }

    /**
     * View assignment details.
     */
    public function show(string $id): JsonResponse
    {
        Gate::authorize('asset_assignment.view');

        $assignment = AssetAssignment::with(['asset', 'employee', 'assigner'])->findOrFail($id);

        return $this->successResponse($assignment, 'Asset assignment retrieved successfully.');
    }

    /**
     * Register asset return.
     */
    public function returnAsset(Request $request, string $id): JsonResponse
    {
        Gate::authorize('asset_assignment.return');

        $assignment = AssetAssignment::findOrFail($id);

        if ($assignment->status !== 'active') {
            return response()->json(['message' => 'This assignment is already returned or inactive.'], 422);
        }

        $validated = $request->validate([
            'returned_date' => 'required|date|after_or_equal:assigned_date',
            'condition_on_return' => 'required|string|in:new,good,fair,poor,damaged',
            'return_notes' => 'nullable|string',
            'received_by' => 'required|uuid|exists:employees,id',
        ]);

        DB::transaction(function () use ($assignment, $validated) {
            // Update assignment details
            $assignment->update([
                'returned_date' => $validated['returned_date'],
                'condition_on_return' => $validated['condition_on_return'],
                'return_notes' => $validated['return_notes'],
                'received_by' => $validated['received_by'],
                'status' => 'returned',
            ]);

            // Update asset status to available
            $asset = $assignment->asset;
            $asset->update([
                'status' => 'available',
                'condition' => $validated['condition_on_return'],
            ]);
        });

        return $this->successResponse($assignment->fresh(['asset', 'employee']), 'Asset returned successfully.');
    }
}
