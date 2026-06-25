<?php

declare(strict_types=1);

namespace Modules\Talent\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Talent\Models\Skill;

class SkillController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('talent.skills.read');

        $query = Skill::query();

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->has('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $skills = $query->paginate($request->integer('per_page', 100));

        return $this->successResponse($skills, 'Skills retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('talent.skills.create');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:hard_skill,soft_skill,technical,leadership,language',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $skill = Skill::create($validated);

        return $this->createdResponse($skill, 'Skill created successfully.');
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('talent.skills.read');

        $skill = Skill::findOrFail($id);

        return $this->successResponse($skill, 'Skill retrieved successfully.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('talent.skills.update');

        $skill = Skill::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:hard_skill,soft_skill,technical,leadership,language',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $skill->update($validated);

        return $this->successResponse($skill, 'Skill updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('talent.skills.delete');

        $skill = Skill::findOrFail($id);
        $skill->delete();

        return $this->successResponse(null, 'Skill deleted successfully.');
    }
}
