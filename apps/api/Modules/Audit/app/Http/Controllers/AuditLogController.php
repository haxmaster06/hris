<?php

declare(strict_types=1);

namespace Modules\Audit\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Audit\Repositories\AuditLogRepositoryInterface;

class AuditLogController extends BaseController
{
    public function __construct(
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('audit.logs.read');

        $logs = $this->auditLogRepository->paginate($request->all());

        return $this->successResponse(
            $logs,
            'Log audit berhasil diambil.'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('audit.logs.read');

        $log = $this->auditLogRepository->findOrFail($id);
        $log->load('user');

        return $this->successResponse(
            $log,
            'Detail log audit berhasil diambil.'
        );
    }
}
