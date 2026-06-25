<?php

declare(strict_types=1);

namespace Modules\Disciplinary\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Modules\Disciplinary\Models\Investigation;
use Modules\Disciplinary\Models\DisciplinaryCase;

class InvestigationController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('disciplinary.investigations.read');

        $query = Investigation::query()->with(['case', 'investigator']);

        if ($request->has('disciplinary_case_id')) {
            $query->where('disciplinary_case_id', $request->input('disciplinary_case_id'));
        }

        if ($request->has('investigator_id')) {
            $query->where('investigator_id', $request->input('investigator_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $investigations = $query->paginate($request->integer('per_page', 15));

        return $this->successResponse($investigations, 'Investigations retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('disciplinary.investigations.create');

        $validated = $request->validate([
            'disciplinary_case_id' => 'required|uuid|exists:disciplinary_cases,id',
            'investigator_id' => 'required|uuid|exists:employees,id',
            'findings' => 'nullable|string',
            'recommendation' => 'nullable|string',
            'committee_notes' => 'nullable|string',
            'status' => 'string|in:in_progress,completed',
        ]);

        $investigation = DB::transaction(function () use ($validated) {
            $inv = Investigation::create(array_merge($validated, [
                'completed_at' => ($validated['status'] ?? 'in_progress') === 'completed' ? now() : null,
            ]));

            $case = DisciplinaryCase::findOrFail($validated['disciplinary_case_id']);
            if (($validated['status'] ?? 'in_progress') === 'completed') {
                $case->update(['status' => 'hearing']);
            } else {
                $case->update(['status' => 'under_investigation']);
            }

            return $inv;
        });

        return $this->createdResponse($investigation, 'Investigation started successfully.');
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('disciplinary.investigations.read');

        $investigation = Investigation::with(['case', 'investigator'])->findOrFail($id);

        return $this->successResponse($investigation, 'Investigation retrieved successfully.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('disciplinary.investigations.update');

        $investigation = Investigation::findOrFail($id);

        $validated = $request->validate([
            'investigator_id' => 'required|uuid|exists:employees,id',
            'findings' => 'nullable|string',
            'recommendation' => 'nullable|string',
            'committee_notes' => 'nullable|string',
            'status' => 'required|string|in:in_progress,completed',
        ]);

        $investigation = DB::transaction(function () use ($investigation, $validated) {
            $completedAt = $investigation->completed_at;
            if ($validated['status'] === 'completed' && $investigation->status !== 'completed') {
                $completedAt = now();
            } elseif ($validated['status'] === 'in_progress') {
                $completedAt = null;
            }

            $investigation->update(array_merge($validated, [
                'completed_at' => $completedAt,
            ]));

            $case = DisciplinaryCase::findOrFail($investigation->disciplinary_case_id);
            if ($validated['status'] === 'completed') {
                $case->update(['status' => 'hearing']);
            } else {
                $case->update(['status' => 'under_investigation']);
            }

            return $investigation;
        });

        return $this->successResponse($investigation, 'Investigation updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('disciplinary.investigations.delete');

        $investigation = Investigation::findOrFail($id);
        $investigation->delete();

        return $this->successResponse(null, 'Investigation deleted successfully.');
    }
}
