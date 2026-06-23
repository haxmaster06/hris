<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Organization\Http\Requests\Position\CreatePositionRequest;
use Modules\Organization\Http\Requests\Position\UpdatePositionRequest;
use Modules\Organization\Http\Resources\PositionCollection;
use Modules\Organization\Http\Resources\PositionResource;
use Modules\Organization\Services\PositionService;

class PositionController extends BaseController
{
    public function __construct(
        private readonly PositionService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('organization.positions.read');

        $positions = $this->service->list($request->all());

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            if (in_array('department', $includes)) {
                $positions->load('department');
            }
            if (in_array('division', $includes)) {
                $positions->load('division');
            }
        }

        return $this->successResponse(
            new PositionCollection($positions),
            'Positions retrieved successfully'
        );
    }

    public function store(CreatePositionRequest $request): JsonResponse
    {
        Gate::authorize('organization.positions.create');

        $position = $this->service->create($request->validated());

        return $this->createdResponse(
            new PositionResource($position),
            'Position created successfully'
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        Gate::authorize('organization.positions.read');

        $position = $this->service->findOrFail($id);

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            if (in_array('department', $includes)) {
                $position->load('department');
            }
            if (in_array('division', $includes)) {
                $position->load('division');
            }
        }

        return $this->successResponse(
            new PositionResource($position),
            'Position retrieved successfully'
        );
    }

    public function update(UpdatePositionRequest $request, string $id): JsonResponse
    {
        Gate::authorize('organization.positions.update');

        $position = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new PositionResource($position),
            'Position updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('organization.positions.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Position deleted successfully'
        );
    }
}
