<?php

declare(strict_types=1);

namespace Modules\Certification\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Certification\Http\Requests\CreateCertificationRequest;
use Modules\Certification\Http\Requests\UpdateCertificationRequest;
use Modules\Certification\Http\Resources\CertificationResource;
use Modules\Certification\Services\CertificationService;

class CertificationController extends BaseController
{
    public function __construct(
        private readonly CertificationService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('certification.read');

        $certifications = $this->service->listCertifications($request->all());

        return $this->successResponse(
            CertificationResource::collection($certifications),
            'Certifications retrieved successfully'
        );
    }

    public function store(CreateCertificationRequest $request): JsonResponse
    {
        Gate::authorize('certification.create');

        $certification = $this->service->createCertification($request->validated());

        return $this->createdResponse(
            new CertificationResource($certification),
            'Certification created successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('certification.read');

        $certification = $this->service->findCertification($id);

        return $this->successResponse(
            new CertificationResource($certification),
            'Certification retrieved successfully'
        );
    }

    public function update(UpdateCertificationRequest $request, string $id): JsonResponse
    {
        Gate::authorize('certification.update');

        $certification = $this->service->updateCertification($id, $request->validated());

        return $this->successResponse(
            new CertificationResource($certification),
            'Certification updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('certification.delete');

        $this->service->deleteCertification($id);

        return $this->successResponse(
            null,
            'Certification deleted successfully'
        );
    }
}
