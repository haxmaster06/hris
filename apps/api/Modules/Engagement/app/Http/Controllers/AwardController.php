<?php

declare(strict_types=1);

namespace Modules\Engagement\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Engagement\Models\Award;

class AwardController extends BaseController
{
    /**
     * Get awards wall list.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('award.view');

        $query = Award::query()->with(['employee', 'awarder']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        if ($request->has('category')) {
            $query->where('category', $request->input('category'));
        }

        $awards = $query->latest('awarded_date')->paginate($request->integer('per_page', 15));

        return $this->successResponse($awards, 'Awards retrieved successfully.');
    }

    /**
     * Grant a new award.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('award.create');

        $validated = $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|in:employee_of_month,innovation,teamwork,leadership,service_excellence',
            'awarded_date' => 'required|date',
            'awarded_by' => 'required|uuid|exists:employees,id',
            'certificate_path' => 'nullable|string|max:255',
        ]);

        $award = Award::create($validated);

        return $this->createdResponse($award, 'Award granted successfully.');
    }

    /**
     * View single award details.
     */
    public function show(string $id): JsonResponse
    {
        Gate::authorize('award.view');

        $award = Award::with(['employee', 'awarder'])->findOrFail($id);

        return $this->successResponse($award, 'Award retrieved successfully.');
    }

    /**
     * Update award entry.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('award.create');

        $award = Award::findOrFail($id);

        $validated = $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|in:employee_of_month,innovation,teamwork,leadership,service_excellence',
            'awarded_date' => 'required|date',
            'awarded_by' => 'required|uuid|exists:employees,id',
            'certificate_path' => 'nullable|string|max:255',
        ]);

        $award->update($validated);

        return $this->successResponse($award, 'Award updated successfully.');
    }

    /**
     * Revoke or delete award.
     */
    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('award.delete');

        $award = Award::findOrFail($id);
        $award->delete();

        return $this->successResponse(null, 'Award deleted successfully.');
    }
}
