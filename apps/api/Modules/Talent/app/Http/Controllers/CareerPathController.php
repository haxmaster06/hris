<?php

declare(strict_types=1);

namespace Modules\Talent\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Talent\Models\CareerPath;
use Modules\Organization\Models\Position;

class CareerPathController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('talent.career_paths.read');

        $query = CareerPath::query()->with(['fromPosition', 'toPosition']);

        if ($request->has('from_position_id')) {
            $query->where('from_position_id', $request->input('from_position_id'));
        }

        if ($request->has('to_position_id')) {
            $query->where('to_position_id', $request->input('to_position_id'));
        }

        $paths = $query->paginate($request->integer('per_page', 50));

        return $this->successResponse($paths, 'Career paths retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('talent.career_paths.create');

        $validated = $request->validate([
            'from_position_id' => 'required|uuid|exists:positions,id',
            'to_position_id' => 'required|uuid|exists:positions,id|different:from_position_id',
            'path_type' => 'required|string|in:promotion,lateral,specialization',
            'typical_years' => 'nullable|integer|min:0',
            'requirements' => 'nullable|array',
            'description' => 'nullable|string',
        ]);

        $path = CareerPath::create($validated);

        return $this->createdResponse($path->load(['fromPosition', 'toPosition']), 'Career path defined successfully.');
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('talent.career_paths.read');

        $path = CareerPath::with(['fromPosition', 'toPosition'])->findOrFail($id);

        return $this->successResponse($path, 'Career path retrieved successfully.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('talent.career_paths.update');

        $path = CareerPath::findOrFail($id);

        $validated = $request->validate([
            'from_position_id' => 'required|uuid|exists:positions,id',
            'to_position_id' => 'required|uuid|exists:positions,id|different:from_position_id',
            'path_type' => 'required|string|in:promotion,lateral,specialization',
            'typical_years' => 'nullable|integer|min:0',
            'requirements' => 'nullable|array',
            'description' => 'nullable|string',
        ]);

        $path->update($validated);

        return $this->successResponse($path->load(['fromPosition', 'toPosition']), 'Career path updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('talent.career_paths.delete');

        $path = CareerPath::findOrFail($id);
        $path->delete();

        return $this->successResponse(null, 'Career path deleted successfully.');
    }

    public function tree(Request $request): JsonResponse
    {
        Gate::authorize('talent.career_paths.read');

        $positions = Position::all(['id', 'name']);
        $links = CareerPath::all(['from_position_id', 'to_position_id', 'path_type', 'typical_years']);

        return $this->successResponse([
            'nodes' => $positions,
            'edges' => $links,
        ], 'Career tree graph data retrieved successfully.');
    }
}
