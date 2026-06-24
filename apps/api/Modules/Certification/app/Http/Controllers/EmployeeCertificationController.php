<?php

declare(strict_types=1);

namespace Modules\Certification\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Certification\Http\Requests\CreateEmployeeCertificationRequest;
use Modules\Certification\Http\Requests\UpdateEmployeeCertificationRequest;
use Modules\Certification\Http\Resources\EmployeeCertificationResource;
use Modules\Certification\Services\EmployeeCertificationService;

class EmployeeCertificationController extends BaseController
{
    public function __construct(
        private readonly EmployeeCertificationService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('certification.read');

        $empCerts = $this->service->list($request->all());

        return $this->successResponse(
            EmployeeCertificationResource::collection($empCerts),
            'Employee certifications retrieved successfully'
        );
    }

    public function store(CreateEmployeeCertificationRequest $request): JsonResponse
    {
        Gate::authorize('certification.create');

        $file = $request->file('document');
        $data = $request->validated();
        unset($data['document']); // Handle file separately

        $empCert = $this->service->create($data, $file);

        return $this->createdResponse(
            new EmployeeCertificationResource($empCert->load(['employee', 'certification'])),
            'Employee certification created successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('certification.read');

        $empCert = $this->service->findOrFail($id);

        return $this->successResponse(
            new EmployeeCertificationResource($empCert->load(['employee', 'certification'])),
            'Employee certification retrieved successfully'
        );
    }

    public function update(UpdateEmployeeCertificationRequest $request, string $id): JsonResponse
    {
        Gate::authorize('certification.update');

        $file = $request->file('document');
        $data = $request->validated();
        unset($data['document']); // Handle file separately

        $empCert = $this->service->update($id, $data, $file);

        return $this->successResponse(
            new EmployeeCertificationResource($empCert->load(['employee', 'certification'])),
            'Employee certification updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('certification.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Employee certification deleted successfully'
        );
    }

    public function download(string $id): JsonResponse
    {
        Gate::authorize('certification.read');

        try {
            $url = $this->service->getSignedUrl($id);
            return $this->successResponse([
                'url' => $url
            ], 'Download URL generated successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    public function expiryStats(): JsonResponse
    {
        Gate::authorize('certification.read');

        $stats = $this->service->getExpiryStats();

        return $this->successResponse(
            $stats,
            'Certification expiry statistics retrieved successfully'
        );
    }
}
