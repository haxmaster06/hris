<?php

declare(strict_types=1);

namespace Modules\Performance\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Performance\Models\KPI;

class KPIController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('performance.kpi.read');

        $query = KPI::query();

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->has('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $kpis = $query->paginate($request->integer('per_page', 15));

        return $this->successResponse($kpis, 'KPIs retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('performance.kpi.create');

        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:kpis,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:30',
            'unit' => 'required|string|max:20',
            'measurement_type' => 'required|string|in:higher_better,lower_better,target_exact',
            'position_id' => 'nullable|uuid',
            'is_active' => 'boolean',
        ]);

        $kpi = KPI::create($validated);

        return $this->createdResponse($kpi, 'KPI created successfully.');
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('performance.kpi.read');

        $kpi = KPI::findOrFail($id);

        return $this->successResponse($kpi, 'KPI retrieved successfully.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('performance.kpi.update');

        $kpi = KPI::findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:kpis,code,' . $kpi->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:30',
            'unit' => 'required|string|max:20',
            'measurement_type' => 'required|string|in:higher_better,lower_better,target_exact',
            'position_id' => 'nullable|uuid',
            'is_active' => 'boolean',
        ]);

        $kpi->update($validated);

        return $this->successResponse($kpi, 'KPI updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('performance.kpi.delete');

        $kpi = KPI::findOrFail($id);
        $kpi->delete();

        return $this->successResponse(null, 'KPI deleted successfully.');
    }
}
