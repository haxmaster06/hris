<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Organization\Http\Requests\CreateCostCenterRequest;
use Modules\Organization\Http\Requests\UpdateCostCenterRequest;
use Modules\Organization\Http\Resources\CostCenterCollection;
use Modules\Organization\Http\Resources\CostCenterResource;
use Modules\Organization\Services\CostCenterService;

class CostCenterController extends BaseController
{
    public function __construct(
        private readonly CostCenterService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('organization.cost_centers.read');

        $costCenters = $this->service->list($request->all());

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            if (in_array('company', $includes)) {
                $costCenters->load('company');
            }
        }

        return $this->successResponse(
            new CostCenterCollection($costCenters),
            'Cost centers retrieved successfully'
        );
    }

    public function store(CreateCostCenterRequest $request): JsonResponse
    {
        Gate::authorize('organization.cost_centers.create');

        $costCenter = $this->service->create($request->validated());

        return $this->createdResponse(
            new CostCenterResource($costCenter),
            'Cost center created successfully'
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        Gate::authorize('organization.cost_centers.read');

        $costCenter = $this->service->findOrFail($id);

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            if (in_array('company', $includes)) {
                $costCenter->load('company');
            }
        }

        return $this->successResponse(
            new CostCenterResource($costCenter),
            'Cost center retrieved successfully'
        );
    }

    public function update(UpdateCostCenterRequest $request, string $id): JsonResponse
    {
        Gate::authorize('organization.cost_centers.update');

        $costCenter = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new CostCenterResource($costCenter),
            'Cost center updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('organization.cost_centers.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Cost center deleted successfully'
        );
    }
}
