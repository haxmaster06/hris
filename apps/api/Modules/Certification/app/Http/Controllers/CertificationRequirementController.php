<?php

declare(strict_types=1);

namespace Modules\Certification\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Certification\Http\Requests\CreateRequirementRequest;
use Modules\Certification\Http\Resources\CertificationRequirementResource;
use Modules\Certification\Services\CertificationService;

class CertificationRequirementController extends BaseController
{
    public function __construct(
        private readonly CertificationService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('certification.read');

        $reqs = $this->service->listRequirements($request->all());

        return $this->successResponse(
            CertificationRequirementResource::collection($reqs),
            'Certification requirements retrieved successfully'
        );
    }

    public function store(CreateRequirementRequest $request): JsonResponse
    {
        Gate::authorize('certification.create');

        $req = $this->service->createRequirement($request->validated());

        return $this->createdResponse(
            new CertificationRequirementResource($req->load(['position', 'certification'])),
            'Certification requirement created successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('certification.read');

        $req = $this->service->findRequirement($id);

        return $this->successResponse(
            new CertificationRequirementResource($req->load(['position', 'certification'])),
            'Certification requirement retrieved successfully'
        );
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('certification.update');

        $validated = $request->validate([
            'is_mandatory' => ['required', 'boolean'],
        ]);

        $req = $this->service->updateRequirement($id, $validated);

        return $this->successResponse(
            new CertificationRequirementResource($req->load(['position', 'certification'])),
            'Certification requirement updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('certification.delete');

        $this->service->deleteRequirement($id);

        return $this->successResponse(
            null,
            'Certification requirement deleted successfully'
        );
    }
}
