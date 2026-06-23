<?php

declare(strict_types=1);

namespace Modules\Leave\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Leave\Http\Requests\LeaveRequestRequest;
use Modules\Leave\Http\Requests\LeaveApprovalRequest;
use Modules\Leave\Http\Resources\LeaveRequestResource;
use Modules\Leave\Http\Resources\LeaveRequestCollection;
use Modules\Leave\Services\LeaveService;

class LeaveRequestController extends BaseController
{
    public function __construct(
        private readonly LeaveService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('leave.read');

        $requests = $this->service->list($request->all());

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['employee', 'leaveType', 'approvals.approver'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations)) {
                    $requests->load($relation);
                }
            }
        }

        return $this->successResponse(
            new LeaveRequestCollection($requests),
            'Leave requests retrieved successfully'
        );
    }

    public function store(LeaveRequestRequest $request): JsonResponse
    {
        Gate::authorize('leave.create');

        $data = $request->validated();
        $leaveRequest = $this->service->submitRequest(
            $data['employee_id'],
            $data['leave_type_id'],
            $data['start_date'],
            $data['end_date'],
            $data['reason'] ?? null
        );

        $leaveRequest->load(['employee', 'leaveType']);

        return $this->createdResponse(
            new LeaveRequestResource($leaveRequest),
            'Leave request submitted successfully'
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        Gate::authorize('leave.read');

        $leaveRequest = $this->service->requestRepository->findOrFail($id);

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['employee', 'leaveType', 'approvals.approver'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations)) {
                    $leaveRequest->load($relation);
                }
            }
        }

        return $this->successResponse(
            new LeaveRequestResource($leaveRequest),
            'Leave request retrieved successfully'
        );
    }

    public function approve(LeaveApprovalRequest $request, string $id): JsonResponse
    {
        Gate::authorize('leave.update');

        $data = $request->validated();
        $leaveRequest = $this->service->approveRequest($id, $data['approver_id'], $data['comments'] ?? null);
        $leaveRequest->load(['employee', 'leaveType', 'approvals.approver']);

        return $this->successResponse(
            new LeaveRequestResource($leaveRequest),
            'Leave request approved successfully'
        );
    }

    public function reject(LeaveApprovalRequest $request, string $id): JsonResponse
    {
        Gate::authorize('leave.update');

        $data = $request->validated();
        $leaveRequest = $this->service->rejectRequest($id, $data['approver_id'], $data['comments'] ?? null);
        $leaveRequest->load(['employee', 'leaveType', 'approvals.approver']);

        return $this->successResponse(
            new LeaveRequestResource($leaveRequest),
            'Leave request rejected successfully'
        );
    }
}
