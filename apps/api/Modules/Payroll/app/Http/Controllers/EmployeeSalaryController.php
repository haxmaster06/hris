<?php

declare(strict_types=1);

namespace Modules\Payroll\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Payroll\Repositories\EmployeeSalaryRepositoryInterface;
use Modules\Payroll\Http\Resources\EmployeeSalaryResource;
use Modules\Employee\Models\Employee;

class EmployeeSalaryController extends BaseController
{
    public function __construct(
        private readonly EmployeeSalaryRepositoryInterface $repository
    ) {}

    public function index(Request $request, string $employeeId): JsonResponse
    {
        Gate::authorize('payroll.read');

        $filters = $request->all();
        $filters['employee_id'] = $employeeId;

        $salaries = $this->repository->paginate($filters);

        return $this->successResponse(
            EmployeeSalaryResource::collection($salaries),
            'Riwayat gaji karyawan berhasil diambil'
        );
    }

    public function store(Request $request, string $employeeId): JsonResponse
    {
        Gate::authorize('payroll.write');

        // Pastikan employee valid
        Employee::findOrFail($employeeId);

        $validated = $request->validate([
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'tax_method' => ['required', 'string', 'in:gross,nett,gross_up'],
            'tax_status' => ['required', 'string', 'in:TK/0,TK/1,TK/2,TK/3,K/0,K/1,K/2,K/3'],
            'bpjs_class' => ['required', 'string', 'in:1,2,3'],
            'bank_name' => ['nullable', 'string', 'max:50'],
            'bank_account' => ['nullable', 'string', 'max:30'],
            'bank_holder_name' => ['nullable', 'string', 'max:255'],
            'effective_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['employee_id'] = $employeeId;

        $salary = $this->repository->create($validated);

        return $this->createdResponse(
            new EmployeeSalaryResource($salary),
            'Struktur gaji berhasil didaftarkan'
        );
    }

    public function show(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('payroll.read');

        $salary = $this->repository->findOrFail($id);

        if ($salary->employee_id !== $employeeId) {
            return $this->errorResponse('Data gaji tidak sesuai dengan karyawan ini', 404);
        }

        return $this->successResponse(
            new EmployeeSalaryResource($salary),
            'Data gaji berhasil ditemukan'
        );
    }

    public function update(Request $request, string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $salary = $this->repository->findOrFail($id);

        if ($salary->employee_id !== $employeeId) {
            return $this->errorResponse('Data gaji tidak sesuai dengan karyawan ini', 404);
        }

        $validated = $request->validate([
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'tax_method' => ['required', 'string', 'in:gross,nett,gross_up'],
            'tax_status' => ['required', 'string', 'in:TK/0,TK/1,TK/2,TK/3,K/0,K/1,K/2,K/3'],
            'bpjs_class' => ['required', 'string', 'in:1,2,3'],
            'bank_name' => ['nullable', 'string', 'max:50'],
            'bank_account' => ['nullable', 'string', 'max:30'],
            'bank_holder_name' => ['nullable', 'string', 'max:255'],
            'effective_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $updated = $this->repository->update($id, $validated);

        return $this->successResponse(
            new EmployeeSalaryResource($updated),
            'Struktur gaji berhasil diperbarui'
        );
    }

    public function destroy(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $salary = $this->repository->findOrFail($id);

        if ($salary->employee_id !== $employeeId) {
            return $this->errorResponse('Data gaji tidak sesuai dengan karyawan ini', 404);
        }

        $this->repository->delete($id);

        return $this->successResponse(
            null,
            'Data gaji berhasil dihapus'
        );
    }
}
