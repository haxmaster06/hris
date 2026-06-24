<?php

declare(strict_types=1);

namespace Modules\Recruitment\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Recruitment\Http\Resources\HiringApprovalCollection;
use Modules\Recruitment\Http\Resources\HiringApprovalResource;
use Modules\Recruitment\Services\HiringApprovalService;

class HiringApprovalController extends BaseController
{
    public function __construct(
        private readonly HiringApprovalService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('recruitment.approval.read');

        $approvals = $this->service->list($request->all());

        return $this->successResponse(
            new HiringApprovalCollection($approvals),
            'Hiring approvals retrieved successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('recruitment.approval.read');

        $approval = $this->service->findOrFail($id);

        return $this->successResponse(
            new HiringApprovalResource($approval),
            'Hiring approval retrieved successfully'
        );
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        Gate::authorize('recruitment.approval.update');

        $validated = $request->validate([
            'comments' => ['nullable', 'string', 'max:255'],
        ]);

        $approval = $this->service->approve($id, $validated['comments'] ?? null);

        return $this->successResponse(
            new HiringApprovalResource($approval),
            'Hiring stage approved successfully'
        );
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        Gate::authorize('recruitment.approval.update');

        $validated = $request->validate([
            'comments' => ['required', 'string', 'max:255'],
        ]);

        $approval = $this->service->reject($id, $validated['comments']);

        return $this->successResponse(
            new HiringApprovalResource($approval),
            'Hiring stage rejected successfully'
        );
    }
}
