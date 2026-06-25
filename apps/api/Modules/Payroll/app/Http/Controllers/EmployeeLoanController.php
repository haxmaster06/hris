<?php

declare(strict_types=1);

namespace Modules\Payroll\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Payroll\Repositories\EmployeeLoanRepositoryInterface;
use Modules\Payroll\Http\Resources\EmployeeLoanResource;
use Modules\Employee\Models\Employee;
use Illuminate\Support\Str;

class EmployeeLoanController extends BaseController
{
    public function __construct(
        private readonly EmployeeLoanRepositoryInterface $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('payroll.read');

        $loans = $this->repository->paginate($request->all());

        return $this->successResponse(
            EmployeeLoanResource::collection($loans),
            'Daftar pinjaman karyawan berhasil diambil'
        );
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('payroll.write');

        $validated = $request->validate([
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'principal_amount' => ['required', 'numeric', 'min:0'],
            'installment_amount' => ['required', 'numeric', 'min:0', 'max:principal_amount'],
            'total_installments' => ['required', 'integer', 'min:1'],
            'start_date' => ['required', 'date'],
            'reason' => ['nullable', 'string'],
        ]);

        $validated['remaining_amount'] = $validated['principal_amount'];
        $validated['loan_number'] = 'LOAN-' . date('Ymd') . '-' . strtoupper(Str::random(5));
        $validated['status'] = 'active';
        $validated['approved_by'] = auth()->id();

        $loan = $this->repository->create($validated);

        return $this->createdResponse(
            new EmployeeLoanResource($loan),
            'Pinjaman karyawan berhasil dibuat'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('payroll.read');

        $loan = $this->repository->findOrFail($id);

        return $this->successResponse(
            new EmployeeLoanResource($loan),
            'Data pinjaman berhasil ditemukan'
        );
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $loan = $this->repository->findOrFail($id);

        $validated = $request->validate([
            'principal_amount' => ['required', 'numeric', 'min:0'],
            'installment_amount' => ['required', 'numeric', 'min:0'],
            'total_installments' => ['required', 'integer', 'min:1'],
            'start_date' => ['required', 'date'],
            'reason' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:active,completed,cancelled'],
        ]);

        if (isset($validated['principal_amount'])) {
            // Update remaining amount based on new principal and paid installments
            // Simplification: if not fully paid yet
            $validated['remaining_amount'] = $validated['principal_amount'] - ($loan->paid_installments * $loan->installment_amount);
            $validated['remaining_amount'] = max($validated['remaining_amount'], 0);
        }

        $updated = $this->repository->update($id, $validated);

        return $this->successResponse(
            new EmployeeLoanResource($updated),
            'Data pinjaman berhasil diperbarui'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $this->repository->delete($id);

        return $this->successResponse(
            null,
            'Data pinjaman berhasil dihapus'
        );
    }
}
