<?php

declare(strict_types=1);

namespace Modules\Talent\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Talent\Models\EmployeeSkill;
use Modules\Talent\Models\Skill;
use Modules\Employee\Models\Employee;

class EmployeeSkillController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('talent.skills.read');

        $query = EmployeeSkill::query()->with(['employee', 'skill', 'assessor']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        if ($request->has('skill_id')) {
            $query->where('skill_id', $request->input('skill_id'));
        }

        $employeeSkills = $query->paginate($request->integer('per_page', 25));

        return $this->successResponse($employeeSkills, 'Employee skills retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('talent.skills.create');

        $validated = $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'skill_id' => 'required|uuid|exists:skills,id',
            'proficiency_level' => 'required|integer|min:1|max:5',
            'assessed_at' => 'nullable|date',
            'assessed_by' => 'nullable|uuid|exists:employees,id',
            'notes' => 'nullable|string',
        ]);

        $employeeSkill = EmployeeSkill::updateOrCreate(
            [
                'employee_id' => $validated['employee_id'],
                'skill_id' => $validated['skill_id'],
            ],
            array_merge($validated, [
                'assessed_at' => $validated['assessed_at'] ?? now()->toDateString(),
            ])
        );

        return $this->createdResponse($employeeSkill->load(['employee', 'skill']), 'Employee skill assessed successfully.');
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('talent.skills.read');

        $employeeSkill = EmployeeSkill::with(['employee', 'skill', 'assessor'])->findOrFail($id);

        return $this->successResponse($employeeSkill, 'Employee skill retrieved successfully.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('talent.skills.update');

        $employeeSkill = EmployeeSkill::findOrFail($id);

        $validated = $request->validate([
            'proficiency_level' => 'required|integer|min:1|max:5',
            'assessed_at' => 'nullable|date',
            'assessed_by' => 'nullable|uuid|exists:employees,id',
            'notes' => 'nullable|string',
        ]);

        $employeeSkill->update($validated);

        return $this->successResponse($employeeSkill->load(['employee', 'skill']), 'Employee skill updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('talent.skills.delete');

        $employeeSkill = EmployeeSkill::findOrFail($id);
        $employeeSkill->delete();

        return $this->successResponse(null, 'Employee skill assessment removed successfully.');
    }

    public function heatmap(Request $request): JsonResponse
    {
        Gate::authorize('talent.skills.read');

        $activeSkills = Skill::where('is_active', true)->get(['id', 'name', 'category']);
        $activeEmployees = Employee::where('status', 'active')->get(['id', 'name', 'job_title']);
        
        $allocations = EmployeeSkill::get(['employee_id', 'skill_id', 'proficiency_level']);

        $matrix = [];
        foreach ($allocations as $alloc) {
            $matrix[$alloc->employee_id][$alloc->skill_id] = $alloc->proficiency_level;
        }

        return $this->successResponse([
            'skills' => $activeSkills,
            'employees' => $activeEmployees,
            'heatmap' => $matrix,
        ], 'Heatmap matrix data retrieved successfully.');
    }
}
