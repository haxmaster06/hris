<?php

declare(strict_types=1);

namespace Modules\Payroll\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Payroll\Repositories\EmployeeAllowanceRepositoryInterface;
use Modules\Payroll\Http\Resources\EmployeeAllowanceResource;
use Modules\Employee\Models\Employee;

class EmployeeAllowanceController extends BaseController
{
    public function __construct(
        private readonly EmployeeAllowanceRepositoryInterface $repository
    ) {}

    public function index(Request $request, string $employeeId): JsonResponse
    {
        Gate::authorize('payroll.read');

        $filters = $request->all();
        $filters['employee_id'] = $employeeId;

        $allowances = $this->repository->paginate($filters);

        return $this->successResponse(
            EmployeeAllowanceResource::collection($allowances),
            'Daftar tunjangan karyawan berhasil diambil'
        );
    }

    public function store(Request $request, string $employeeId): JsonResponse
    {
        Gate::authorize('payroll.write');

        Employee::findOrFail($employeeId);

        $validated = $request->validate([
            'payroll_component_id' => ['required', 'uuid', 'exists:payroll_components,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'effective_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:effective_date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['employee_id'] = $employeeId;

        $allowance = $this->repository->create($validated);

        return $this->createdResponse(
            new EmployeeAllowanceResource($allowance),
            'Tunjangan karyawan berhasil ditambahkan'
        );
    }

    public function show(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('payroll.read');

        $allowance = $this->repository->findOrFail($id);

        if ($allowance->employee_id !== $employeeId) {
            return $this->errorResponse('Tunjangan tidak sesuai dengan karyawan ini', 404);
        }

        return $this->successResponse(
            new EmployeeAllowanceResource($allowance),
            'Tunjangan karyawan berhasil ditemukan'
        );
    }

    public function update(Request $request, string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $allowance = $this->repository->findOrFail($id);

        if ($allowance->employee_id !== $employeeId) {
            return $this->errorResponse('Tunjangan tidak sesuai dengan karyawan ini', 404);
        }

        $validated = $request->validate([
            'payroll_component_id' => ['required', 'uuid', 'exists:payroll_components,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'effective_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:effective_date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $updated = $this->repository->update($id, $validated);

        return $this->successResponse(
            new EmployeeAllowanceResource($updated),
            'Tunjangan karyawan berhasil diperbarui'
        );
    }

    public function destroy(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $allowance = $this->repository->findOrFail($id);

        if ($allowance->employee_id !== $employeeId) {
            return $this->errorResponse('Tunjangan tidak sesuai dengan karyawan ini', 404);
        }

        $this->repository->delete($id);

        return $this->successResponse(
            null,
            'Tunjangan karyawan berhasil dihapus'
        );
    }
}
