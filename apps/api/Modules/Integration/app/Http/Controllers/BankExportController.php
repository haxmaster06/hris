<?php

declare(strict_types=1);

namespace Modules\Integration\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Payroll\Models\PayrollPeriod;
use Modules\Integration\Services\BankExport\BCABankExport;
use Modules\Integration\Services\BankExport\MandiriBankExport;
use Modules\Integration\Services\BankExport\BRIBankExport;
use Modules\Integration\Services\BankExport\BNIBankExport;

class BankExportController extends BaseController
{
    public function export(Request $request): JsonResponse
    {
        Gate::authorize('integration.export');

        $request->validate([
            'payroll_period_id' => ['required', 'uuid', 'exists:payroll_periods,id'],
            'bank' => ['required', 'string', 'in:bca,mandiri,bri,bni'],
        ]);

        $period = PayrollPeriod::with(['payrollRuns.employee'])->findOrFail($request->payroll_period_id);
        $bank = strtolower($request->bank);

        $exporter = match ($bank) {
            'bca' => new BCABankExport(),
            'mandiri' => new MandiriBankExport(),
            'bri' => new BRIBankExport(),
            'bni' => new BNIBankExport(),
        };

        $content = $exporter->generateFile($period);
        $format = $exporter->getFormat();
        $filename = 'payroll_export_' . $bank . '_' . $period->year . '_' . $period->month . '.' . $format;

        return $this->successResponse([
            'filename' => $filename,
            'format' => $format,
            'content' => base64_encode($content),
        ], 'Bank export file generated successfully');
    }
}
