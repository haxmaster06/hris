<?php

declare(strict_types=1);

namespace Modules\Audit\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Audit\Services\ComplianceService;

class ComplianceController extends BaseController
{
    public function __construct(
        private readonly ComplianceService $complianceService
    ) {}

    public function expiringContracts(Request $request): JsonResponse
    {
        Gate::authorize('audit.compliance.read');

        $days = $request->integer('days', 30);
        $contracts = $this->complianceService->getExpiringContracts($days);

        return $this->successResponse(
            $contracts,
            'Data kontrak yang akan habis berhasil diambil.'
        );
    }

    public function expiringCertifications(Request $request): JsonResponse
    {
        Gate::authorize('audit.compliance.read');

        $days = $request->integer('days', 30);
        $certifications = $this->complianceService->getExpiringCertifications($days);

        return $this->successResponse(
            $certifications,
            'Data sertifikasi yang akan habis berhasil diambil.'
        );
    }
}
