<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Organization\Http\Requests\Branch\CreateBranchRequest;
use Modules\Organization\Http\Requests\Branch\UpdateBranchRequest;
use Modules\Organization\Http\Resources\BranchCollection;
use Modules\Organization\Http\Resources\BranchResource;
use Modules\Organization\Services\BranchService;

class BranchController extends BaseController
{
    public function __construct(
        private readonly BranchService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('organization.branches.read');

        $branches = $this->service->list($request->all());

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            if (in_array('company', $includes)) {
                $branches->load('company');
            }
        }

        return $this->successResponse(
            new BranchCollection($branches),
            'Branches retrieved successfully'
        );
    }

    public function store(CreateBranchRequest $request): JsonResponse
    {
        Gate::authorize('organization.branches.create');

        $branch = $this->service->create($request->validated());

        return $this->createdResponse(
            new BranchResource($branch),
            'Branch created successfully'
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        Gate::authorize('organization.branches.read');

        $branch = $this->service->findOrFail($id);

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            if (in_array('company', $includes)) {
                $branch->load('company');
            }
        }

        return $this->successResponse(
            new BranchResource($branch),
            'Branch retrieved successfully'
        );
    }

    public function update(UpdateBranchRequest $request, string $id): JsonResponse
    {
        Gate::authorize('organization.branches.update');

        $branch = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new BranchResource($branch),
            'Branch updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('organization.branches.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Branch deleted successfully'
        );
    }
}
