<?php

declare(strict_types=1);

namespace Modules\Performance\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Performance\Models\PerformancePeriod;
use Modules\Performance\Models\PerformanceReview;
use Modules\Employee\Models\Employee;

class PerformancePeriodController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('performance.kpi.read');

        $periods = PerformancePeriod::query()
            ->orderBy('start_date', 'desc')
            ->paginate($request->integer('per_page', 15));

        return $this->successResponse($periods, 'Performance periods retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('performance.kpi.create');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:quarterly,semi_annual,annual',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'string|in:draft,active,review,calibration,completed',
        ]);

        $period = PerformancePeriod::create($validated);

        return $this->createdResponse($period, 'Performance period created successfully.');
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('performance.kpi.read');

        $period = PerformancePeriod::findOrFail($id);

        return $this->successResponse($period, 'Performance period retrieved successfully.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('performance.kpi.update');

        $period = PerformancePeriod::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:quarterly,semi_annual,annual',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'string|in:draft,active,review,calibration,completed',
        ]);

        $period->update($validated);

        return $this->successResponse($period, 'Performance period updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('performance.kpi.delete');

        $period = PerformancePeriod::findOrFail($id);
        $period->delete();

        return $this->successResponse(null, 'Performance period deleted successfully.');
    }

    public function startReview(string $id): JsonResponse
    {
        Gate::authorize('performance.kpi.update');

        $period = PerformancePeriod::findOrFail($id);
        $period->update(['status' => 'review']);

        $activeEmployees = Employee::where('status', 'active')->get();
        $createdCount = 0;

        foreach ($activeEmployees as $employee) {
            $exists = PerformanceReview::where('performance_period_id', $period->id)
                ->where('employee_id', $employee->id)
                ->exists();

            if (!$exists) {
                PerformanceReview::create([
                    'performance_period_id' => $period->id,
                    'employee_id' => $employee->id,
                    'status' => 'self_review',
                    'manager_id' => $employee->reports_to,
                ]);
                $createdCount++;
            }
        }

        return $this->successResponse([
            'period' => $period,
            'scaffolded_reviews' => $createdCount,
        ], "Review phase started successfully. Scaffolded {$createdCount} review sheets.");
    }
}
