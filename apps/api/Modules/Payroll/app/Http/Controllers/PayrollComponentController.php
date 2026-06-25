<?php

declare(strict_types=1);

namespace Modules\Payroll\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Payroll\Repositories\PayrollComponentRepositoryInterface;
use Modules\Payroll\Http\Resources\PayrollComponentResource;

class PayrollComponentController extends BaseController
{
    public function __construct(
        private readonly PayrollComponentRepositoryInterface $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('payroll.read');

        $components = $this->repository->paginate($request->all());

        return $this->successResponse(
            PayrollComponentResource::collection($components),
            'Komponen gaji berhasil diambil'
        );
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('payroll.write');

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:payroll_components,code'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:earning,deduction'],
            'category' => ['required', 'string', 'in:basic_salary,fixed_allowance,variable_allowance,overtime,tax,bpjs,loan,penalty'],
            'is_taxable' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $component = $this->repository->create($validated);

        return $this->createdResponse(
            new PayrollComponentResource($component),
            'Komponen gaji berhasil dibuat'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('payroll.read');

        $component = $this->repository->findOrFail($id);

        return $this->successResponse(
            new PayrollComponentResource($component),
            'Komponen gaji berhasil ditemukan'
        );
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $component = $this->repository->findOrFail($id);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:payroll_components,code,' . $component->id],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:earning,deduction'],
            'category' => ['required', 'string', 'in:basic_salary,fixed_allowance,variable_allowance,overtime,tax,bpjs,loan,penalty'],
            'is_taxable' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $updated = $this->repository->update($id, $validated);

        return $this->successResponse(
            new PayrollComponentResource($updated),
            'Komponen gaji berhasil diperbarui'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $this->repository->delete($id);

        return $this->successResponse(
            null,
            'Komponen gaji berhasil dihapus'
        );
    }
}
