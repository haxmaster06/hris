<?php

declare(strict_types=1);

namespace Modules\Leave\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Leave\Models\Holiday;

class HolidayController extends BaseController
{
    /**
     * List all holidays.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('holiday.view');

        $query = Holiday::query();

        if ($request->has('year')) {
            $query->whereYear('date', $request->integer('year'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        $holidays = $query->orderBy('date')->get();

        return $this->successResponse($holidays, 'Holidays retrieved successfully.');
    }

    /**
     * Create new holiday.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('holiday.create');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'type' => 'required|string|in:public,company',
            'is_recurring' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $holiday = Holiday::create($validated);

        return $this->createdResponse($holiday, 'Holiday created successfully.');
    }

    /**
     * View holiday details.
     */
    public function show(string $id): JsonResponse
    {
        Gate::authorize('holiday.view');

        $holiday = Holiday::findOrFail($id);

        return $this->successResponse($holiday, 'Holiday retrieved successfully.');
    }

    /**
     * Update holiday.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('holiday.update');

        $holiday = Holiday::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'type' => 'required|string|in:public,company',
            'is_recurring' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $holiday->update($validated);

        return $this->successResponse($holiday, 'Holiday updated successfully.');
    }

    /**
     * Delete holiday.
     */
    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('holiday.delete');

        $holiday = Holiday::findOrFail($id);
        $holiday->delete();

        return $this->successResponse(null, 'Holiday deleted successfully.');
    }
}
