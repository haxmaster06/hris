<?php

declare(strict_types=1);

namespace Modules\Payroll\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Payroll\Repositories\PayrollPeriodRepositoryInterface;
use Modules\Payroll\Http\Resources\PayrollPeriodResource;
use Modules\Payroll\Services\PayrollCalculationService;
use Exception;

class PayrollPeriodController extends BaseController
{
    public function __construct(
        private readonly PayrollPeriodRepositoryInterface $repository,
        private readonly PayrollCalculationService $calculationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('payroll.read');

        $periods = $this->repository->paginate($request->all());

        return $this->successResponse(
            PayrollPeriodResource::collection($periods),
            'Periode penggajian berhasil diambil'
        );
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('payroll.write');

        $validated = $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'name' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'cut_off_date' => ['required', 'date', 'after_or_equal:start_date'],
            'payment_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        if (empty($validated['name'])) {
            $monthNames = [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
            ];
            $validated['name'] = $monthNames[$validated['month']] . ' ' . $validated['year'];
        }

        // Cek duplicate
        $existing = $this->repository->findByMonthAndYear((int) $validated['month'], (int) $validated['year']);
        if ($existing) {
            return $this->errorResponse('Periode untuk bulan dan tahun tersebut sudah ada.', 422);
        }

        $period = $this->repository->create($validated);

        return $this->createdResponse(
            new PayrollPeriodResource($period),
            'Periode penggajian berhasil dibuat'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('payroll.read');

        $period = $this->repository->findOrFail($id);

        return $this->successResponse(
            new PayrollPeriodResource($period),
            'Periode penggajian berhasil ditemukan'
        );
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $period = $this->repository->findOrFail($id);

        if (in_array($period->status, ['locked', 'paid'])) {
            return $this->errorResponse('Periode sudah dikunci dan tidak dapat diubah.', 422);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'cut_off_date' => ['required', 'date', 'after_or_equal:start_date'],
            'payment_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $updated = $this->repository->update($id, $validated);

        return $this->successResponse(
            new PayrollPeriodResource($updated),
            'Periode penggajian berhasil diperbarui'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $period = $this->repository->findOrFail($id);

        if (in_array($period->status, ['locked', 'paid'])) {
            return $this->errorResponse('Periode sudah dikunci dan tidak dapat dihapus.', 422);
        }

        $this->repository->delete($id);

        return $this->successResponse(
            null,
            'Periode penggajian berhasil dihapus'
        );
    }

    /**
     * Hitung gaji massal (calculate) untuk seluruh karyawan di periode penggajian terpilih.
     */
    public function calculate(string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $period = $this->repository->findOrFail($id);

        if (in_array($period->status, ['locked', 'paid'])) {
            return $this->errorResponse('Gaji periode ini sudah dikunci.', 422);
        }

        $period->update([
            'status' => 'processing',
            'processed_at' => now(),
            'processed_by' => auth()->id(),
        ]);

        try {
            $runs = $this->calculationService->calculateForPeriod($period);
            
            $period->update(['status' => 'calculated']);

            return $this->successResponse(
                [
                    'period' => new PayrollPeriodResource($period),
                    'total_processed' => $runs->count()
                ],
                'Proses kalkulasi gaji berhasil diselesaikan'
            );
        } catch (Exception $e) {
            $period->update(['status' => 'draft']);
            return $this->errorResponse('Kalkulasi gagal: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Setujui (approve) hasil kalkulasi gaji periode terpilih.
     */
    public function approve(string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $period = $this->repository->findOrFail($id);

        if ($period->status !== 'calculated') {
            return $this->errorResponse('Hanya periode berstatus Calculated yang dapat disetujui.', 422);
        }

        $period->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return $this->successResponse(
            new PayrollPeriodResource($period),
            'Periode penggajian berhasil disetujui'
        );
    }

    /**
     * Kunci periode penggajian (lock). Sisa cicilan pinjaman akan berkurang otomatis.
     */
    public function lock(string $id): JsonResponse
    {
        Gate::authorize('payroll.write');

        $period = $this->repository->findOrFail($id);

        if ($period->status !== 'approved') {
            return $this->errorResponse('Hanya periode berstatus Approved yang dapat dikunci.', 422);
        }

        try {
            $this->calculationService->lockPeriod($period);
            return $this->successResponse(
                new PayrollPeriodResource($period->fresh()),
                'Periode penggajian berhasil dikunci secara permanen'
            );
        } catch (Exception $e) {
            return $this->errorResponse('Gagal mengunci periode: ' . $e->getMessage(), 500);
        }
    }
}
