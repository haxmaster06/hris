<?php

declare(strict_types=1);

namespace Modules\Compensation\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Compensation\Repositories\EmployeeBenefitRepositoryInterface;
use Modules\Compensation\Http\Resources\EmployeeBenefitResource;
use Modules\Employee\Models\Employee;

class EmployeeBenefitController extends BaseController
{
    public function __construct(
        private readonly EmployeeBenefitRepositoryInterface $repository
    ) {}

    public function index(Request $request, string $employeeId): JsonResponse
    {
        Gate::authorize('payroll.read');

        $filters = $request->all();
        $filters['employee_id'] = $employeeId;

        $ebs = $this->repository->paginate($filters);

        return $this->successResponse(
            EmployeeBenefitResource::collection($ebs),
            'Riwayat benefit karyawan berhasil diambil'
        );
    }

    public function store(Request $request, string $employeeId): JsonResponse
    {
        Gate::authorize('payroll.write');

        Employee::findOrFail($employeeId);

        $validated = $request->validate([
            'benefit_id' => ['required', 'uuid', 'exists:benefits,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'string', 'in:active,suspended,terminated'],
        ]);

        $validated['employee_id'] = $employeeId;

        $eb = $this->repository->create($validated);

        return $this->createdResponse(
            new EmployeeBenefitResource($eb),
            'Pendaftaran benefit karyawan berhasil'
        );
    }

    public function show(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('payroll.read');

        $eb = $this->repository->findOrFail($id);

        if ($eb->employee_id !== $employeeId) {
            return $this->errorResponse('Data pendaftaran benefit tidak sesuai dengan karyawan ini', 404);
        }

        return $this->successResponse(
            new EmployeeBenefitResource($eb),
            'Pendaftaran benefit berhasil ditemukan'
        );
    }

    public function update(Request $request, string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $eb = $this->repository->findOrFail($id);

        if ($eb->employee_id !== $employeeId) {
            return $this->errorResponse('Data pendaftaran benefit tidak sesuai dengan karyawan ini', 404);
        }

        $validated = $request->validate([
            'benefit_id' => ['required', 'uuid', 'exists:benefits,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', 'string', 'in:active,suspended,terminated'],
        ]);

        $updated = $this->repository->update($id, $validated);

        return $this->successResponse(
            new EmployeeBenefitResource($updated),
            'Pendaftaran benefit karyawan berhasil diperbarui'
        );
    }

    public function destroy(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $eb = $this->repository->findOrFail($id);

        if ($eb->employee_id !== $employeeId) {
            return $this->errorResponse('Data pendaftaran benefit tidak sesuai dengan karyawan ini', 404);
        }

        $this->repository->delete($id);

        return $this->successResponse(
            null,
            'Pendaftaran benefit berhasil dihapus'
        );
    }
}
