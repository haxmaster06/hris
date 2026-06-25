<?php

declare(strict_types=1);

namespace Modules\Compensation\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Compensation\Repositories\ClaimRepositoryInterface;
use Modules\Compensation\Http\Resources\ClaimResource;
use Illuminate\Support\Str;

class ClaimController extends BaseController
{
    public function __construct(
        private readonly ClaimRepositoryInterface $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $isHR = $user->hasRole(['Super Admin', 'HR Admin', 'HR Manager', 'Manager']);

        if (!$isHR) {
            $employee = \Modules\Employee\Models\Employee::where('user_id', $user->id)->first();
            $filters = $request->all();
            $filters['employee_id'] = $employee?->id ?? '00000000-0000-0000-0000-000000000000';
        } else {
            Gate::authorize('payroll.read');
            $filters = $request->all();
        }

        $claims = $this->repository->paginate($filters);

        return $this->successResponse(
            ClaimResource::collection($claims),
            'Daftar klaim reimbursement berhasil diambil'
        );
    }

    public function store(Request $request): JsonResponse
    {
        // Karyawan biasa boleh membuat klaim miliknya sendiri. HR boleh membuatkan untuk siapa saja.
        $employeeId = $request->input('employee_id');
        $user = auth()->user();
        $employee = \Modules\Employee\Models\Employee::where('user_id', $user->id)->first();
        $loggedInEmployeeId = $employee?->id;

        if ($loggedInEmployeeId !== $employeeId) {
            Gate::authorize('payroll.write');
        }

        $validated = $request->validate([
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'type' => ['required', 'string', 'in:medical,reimbursement,travel,other'],
            'amount' => ['required', 'numeric', 'min:0'],
            'claim_date' => ['required', 'date'],
            'description' => ['required', 'string'],
            'receipt_path' => ['nullable', 'string'],
        ]);

        $validated['claim_number'] = 'CLM-' . date('Ymd') . '-' . strtoupper(Str::random(5));
        $validated['status'] = 'submitted';

        $claim = $this->repository->create($validated);

        return $this->createdResponse(
            new ClaimResource($claim),
            'Klaim reimbursement berhasil diajukan'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('payroll.read');

        $claim = $this->repository->findOrFail($id);

        return $this->successResponse(
            new ClaimResource($claim),
            'Klaim reimbursement berhasil ditemukan'
        );
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $claim = $this->repository->findOrFail($id);

        if (auth()->id() !== $claim->employee_id) {
            Gate::authorize('payroll.write');
        }

        if ($claim->status !== 'submitted') {
            return $this->errorResponse('Klaim yang sudah diproses tidak dapat diedit.', 422);
        }

        $validated = $request->validate([
            'type' => ['required', 'string', 'in:medical,reimbursement,travel,other'],
            'amount' => ['required', 'numeric', 'min:0'],
            'claim_date' => ['required', 'date'],
            'description' => ['required', 'string'],
            'receipt_path' => ['nullable', 'string'],
        ]);

        $updated = $this->repository->update($id, $validated);

        return $this->successResponse(
            new ClaimResource($updated),
            'Klaim reimbursement berhasil diperbarui'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        $claim = $this->repository->findOrFail($id);

        if (auth()->id() !== $claim->employee_id) {
            Gate::authorize('payroll.write');
        }

        if ($claim->status !== 'submitted') {
            return $this->errorResponse('Klaim yang sudah diproses tidak dapat dihapus.', 422);
        }

        $this->repository->delete($id);

        return $this->successResponse(
            null,
            'Klaim reimbursement berhasil dibatalkan/dihapus'
        );
    }

    /**
     * Approve claim request.
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $claim = $this->repository->findOrFail($id);

        if ($claim->status !== 'submitted') {
            return $this->errorResponse('Hanya klaim berstatus Submitted yang dapat disetujui.', 422);
        }

        $validated = $request->validate([
            'approved_amount' => ['required', 'numeric', 'min:0', 'max:' . $claim->amount],
        ]);

        $claim->update([
            'status' => 'approved',
            'approved_amount' => $validated['approved_amount'],
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return $this->successResponse(
            new ClaimResource($claim),
            'Klaim reimbursement berhasil disetujui'
        );
    }

    /**
     * Reject claim request.
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $claim = $this->repository->findOrFail($id);

        if ($claim->status !== 'submitted') {
            return $this->errorResponse('Hanya klaim berstatus Submitted yang dapat ditolak.', 422);
        }

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $claim->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return $this->successResponse(
            new ClaimResource($claim),
            'Klaim reimbursement berhasil ditolak'
        );
    }
}
