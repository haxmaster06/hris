<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Organization\Http\Requests\Division\CreateDivisionRequest;
use Modules\Organization\Http\Requests\Division\UpdateDivisionRequest;
use Modules\Organization\Http\Resources\DivisionCollection;
use Modules\Organization\Http\Resources\DivisionResource;
use Modules\Organization\Services\DivisionService;

class DivisionController extends BaseController
{
    public function __construct(
        private readonly DivisionService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('organization.divisions.read');

        $divisions = $this->service->list($request->all());

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            if (in_array('department', $includes)) {
                $divisions->load('department');
            }
        }

        return $this->successResponse(
            new DivisionCollection($divisions),
            'Divisions retrieved successfully'
        );
    }

    public function store(CreateDivisionRequest $request): JsonResponse
    {
        Gate::authorize('organization.divisions.create');

        $division = $this->service->create($request->validated());

        return $this->createdResponse(
            new DivisionResource($division),
            'Division created successfully'
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        Gate::authorize('organization.divisions.read');

        $division = $this->service->findOrFail($id);

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            if (in_array('department', $includes)) {
                $division->load('department');
            }
        }

        return $this->successResponse(
            new DivisionResource($division),
            'Division retrieved successfully'
        );
    }

    public function update(UpdateDivisionRequest $request, string $id): JsonResponse
    {
        Gate::authorize('organization.divisions.update');

        $division = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new DivisionResource($division),
            'Division updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('organization.divisions.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Division deleted successfully'
        );
    }
}
