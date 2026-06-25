<?php

declare(strict_types=1);

namespace Modules\Payroll\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Payroll\Repositories\PayrollRunRepositoryInterface;
use Modules\Payroll\Http\Resources\PayrollRunResource;

class PayslipController extends BaseController
{
    public function __construct(
        private readonly PayrollRunRepositoryInterface $runRepository
    ) {}

    /**
     * Tampilkan data payslip karyawan berdasarkan ID karyawan dan Periode.
     * URI: GET /payslips/{employee}?period_id=xxx
     */
    public function show(Request $request, string $employeeId): JsonResponse
    {
        // Karyawan biasa hanya boleh melihat payslip miliknya sendiri. HR Manager / Super Admin boleh melihat semua.
        if (auth()->id() !== $employeeId) {
            Gate::authorize('payroll.read');
        }

        $periodId = $request->query('period_id');
        if (!$periodId) {
            return $this->errorResponse('Parameter period_id wajib disertakan.', 422);
        }

        $run = $this->runRepository->findForEmployeeAndPeriod($employeeId, (string) $periodId);
        
        if (!$run) {
            return $this->errorResponse('Slip gaji untuk karyawan dan periode terpilih belum dibuat.', 404);
        }

        // Load details and period
        $run->load(['payrollRunDetails', 'payrollPeriod', 'employee']);

        return $this->successResponse(
            new PayrollRunResource($run),
            'Payslip karyawan berhasil ditemukan'
        );
    }
}
