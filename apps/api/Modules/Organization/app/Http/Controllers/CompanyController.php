<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Organization\Http\Requests\Company\CreateCompanyRequest;
use Modules\Organization\Http\Requests\Company\UpdateCompanyRequest;
use Modules\Organization\Http\Resources\CompanyCollection;
use Modules\Organization\Http\Resources\CompanyResource;
use Modules\Organization\Services\CompanyService;

class CompanyController extends BaseController
{
    public function __construct(
        private readonly CompanyService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('organization.companies.read');

        $companies = $this->service->list($request->all());

        return $this->successResponse(
            new CompanyCollection($companies),
            'Companies retrieved successfully'
        );
    }

    public function store(CreateCompanyRequest $request): JsonResponse
    {
        Gate::authorize('organization.companies.create');

        $company = $this->service->create($request->validated());

        return $this->createdResponse(
            new CompanyResource($company),
            'Company created successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('organization.companies.read');

        $company = $this->service->findOrFail($id);

        return $this->successResponse(
            new CompanyResource($company),
            'Company retrieved successfully'
        );
    }

    public function update(UpdateCompanyRequest $request, string $id): JsonResponse
    {
        Gate::authorize('organization.companies.update');

        $company = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new CompanyResource($company),
            'Company updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('organization.companies.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Company deleted successfully'
        );
    }
}
