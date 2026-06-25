<?php

declare(strict_types=1);

namespace Modules\Performance\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Performance\Models\KPIAssignment;
use Modules\Performance\Models\KPI;

class KPIAssignmentController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('performance.kpi.read');

        $query = KPIAssignment::query()->with(['kpi', 'employee', 'period']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        if ($request->has('performance_period_id')) {
            $query->where('performance_period_id', $request->input('performance_period_id'));
        }

        $assignments = $query->get();

        return $this->successResponse($assignments, 'KPI assignments retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('performance.kpi.create');

        $validated = $request->validate([
            'kpi_id' => 'required|uuid|exists:kpis,id',
            'employee_id' => 'required|uuid|exists:employees,id',
            'performance_period_id' => 'required|uuid|exists:performance_periods,id',
            'target_value' => 'required|numeric',
            'actual_value' => 'nullable|numeric',
            'weight' => 'required|numeric|min:0|max:100',
            'notes' => 'nullable|string',
        ]);

        $score = $this->calculateScore(
            $validated['kpi_id'],
            (float) $validated['target_value'],
            $validated['actual_value'] !== null ? (float) $validated['actual_value'] : null
        );

        $assignment = KPIAssignment::create(array_merge($validated, [
            'score' => $score,
        ]));

        return $this->createdResponse($assignment->load(['kpi', 'employee']), 'KPI assignment created successfully.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('performance.kpi.update');

        $assignment = KPIAssignment::findOrFail($id);

        $validated = $request->validate([
            'target_value' => 'sometimes|required|numeric',
            'actual_value' => 'nullable|numeric',
            'weight' => 'sometimes|required|numeric|min:0|max:100',
            'notes' => 'nullable|string',
        ]);

        $target = isset($validated['target_value']) ? (float) $validated['target_value'] : (float) $assignment->target_value;
        $actual = isset($validated['actual_value']) ? (float) $validated['actual_value'] : ($assignment->actual_value !== null ? (float) $assignment->actual_value : null);

        $score = $this->calculateScore($assignment->kpi_id, $target, $actual);

        $assignment->update(array_merge($validated, [
            'score' => $score,
        ]));

        return $this->successResponse($assignment->load(['kpi', 'employee']), 'KPI assignment updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('performance.kpi.delete');

        $assignment = KPIAssignment::findOrFail($id);
        $assignment->delete();

        return $this->successResponse(null, 'KPI assignment deleted successfully.');
    }

    private function calculateScore(string $kpiId, float $target, ?float $actual): ?float
    {
        if ($actual === null) {
            return null;
        }

        $kpi = KPI::findOrFail($kpiId);
        $measurementType = $kpi->measurement_type;

        $score = 0.0;
        if ($measurementType === 'higher_better') {
            if ($target > 0) {
                $score = ($actual / $target) * 100;
            }
        } elseif ($measurementType === 'lower_better') {
            if ($actual > 0) {
                $score = ($target / $actual) * 100;
            }
        } else { // target_exact
            if ($target > 0) {
                $deviation = abs($actual - $target) / $target;
                $score = max(0.0, 100 - ($deviation * 100));
            } else {
                $score = ($actual == $target) ? 100.0 : 0.0;
            }
        }

        return min(120.0, max(0.0, $score));
    }
}
