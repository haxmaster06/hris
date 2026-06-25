<?php

declare(strict_types=1);

namespace Modules\Compensation\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Compensation\Repositories\BonusSchemeRepositoryInterface;
use Modules\Compensation\Http\Resources\BonusSchemeResource;

class BonusSchemeController extends BaseController
{
    public function __construct(
        private readonly BonusSchemeRepositoryInterface $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('payroll.read');

        $schemes = $this->repository->paginate($request->all());

        return $this->successResponse(
            BonusSchemeResource::collection($schemes),
            'Daftar skema bonus berhasil diambil'
        );
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('payroll.write');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:performance,annual,project,referral,other'],
            'calculation_type' => ['required', 'string', 'in:percentage,fixed_amount'],
            'value' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $scheme = $this->repository->create($validated);

        return $this->createdResponse(
            new BonusSchemeResource($scheme),
            'Skema bonus berhasil dibuat'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('payroll.read');

        $scheme = $this->repository->findOrFail($id);

        return $this->successResponse(
            new BonusSchemeResource($scheme),
            'Skema bonus berhasil ditemukan'
        );
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:performance,annual,project,referral,other'],
            'calculation_type' => ['required', 'string', 'in:percentage,fixed_amount'],
            'value' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $updated = $this->repository->update($id, $validated);

        return $this->successResponse(
            new BonusSchemeResource($updated),
            'Skema bonus berhasil diperbarui'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $this->repository->delete($id);

        return $this->successResponse(
            null,
            'Skema bonus berhasil dihapus'
        );
    }
}
