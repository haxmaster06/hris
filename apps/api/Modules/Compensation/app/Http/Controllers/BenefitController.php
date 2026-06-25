<?php

declare(strict_types=1);

namespace Modules\Compensation\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Compensation\Repositories\BenefitRepositoryInterface;
use Modules\Compensation\Http\Resources\BenefitResource;

class BenefitController extends BaseController
{
    public function __construct(
        private readonly BenefitRepositoryInterface $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('payroll.read'); // Menggunakan policy payroll atau compensation jika didefinisikan

        $benefits = $this->repository->paginate($request->all());

        return $this->successResponse(
            BenefitResource::collection($benefits),
            'Daftar benefit berhasil diambil'
        );
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('payroll.write');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:health_insurance,bpjs,allowance,other'],
            'provider' => ['nullable', 'string', 'max:255'],
            'company_contribution' => ['nullable', 'numeric', 'min:0'],
            'employee_contribution' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $benefit = $this->repository->create($validated);

        return $this->createdResponse(
            new BenefitResource($benefit),
            'Benefit berhasil dibuat'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('payroll.read');

        $benefit = $this->repository->findOrFail($id);

        return $this->successResponse(
            new BenefitResource($benefit),
            'Benefit berhasil ditemukan'
        );
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:health_insurance,bpjs,allowance,other'],
            'provider' => ['nullable', 'string', 'max:255'],
            'company_contribution' => ['nullable', 'numeric', 'min:0'],
            'employee_contribution' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $updated = $this->repository->update($id, $validated);

        return $this->successResponse(
            new BenefitResource($updated),
            'Benefit berhasil diperbarui'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $this->repository->delete($id);

        return $this->successResponse(
            null,
            'Benefit berhasil dihapus'
        );
    }
}
