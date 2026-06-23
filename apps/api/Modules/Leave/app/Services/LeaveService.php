<?php

declare(strict_types=1);

namespace Modules\Leave\Services;

use Modules\Leave\Repositories\LeaveRequestRepositoryInterface;
use Modules\Leave\Repositories\LeaveBalanceRepositoryInterface;
use Modules\Leave\Repositories\LeaveTypeRepositoryInterface;
use Modules\Leave\Repositories\LeaveApprovalRepositoryInterface;
use Modules\Leave\Models\LeaveRequest;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class LeaveService
{
    public function __construct(
        private readonly LeaveRequestRepositoryInterface $requestRepository,
        private readonly LeaveBalanceRepositoryInterface $balanceRepository,
        private readonly LeaveTypeRepositoryInterface $typeRepository,
        private readonly LeaveApprovalRepositoryInterface $approvalRepository
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->requestRepository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function submitRequest(string $employeeId, string $leaveTypeId, string $startDate, string $endDate, ?string $reason): LeaveRequest
    {
        return DB::transaction(function () use ($employeeId, $leaveTypeId, $startDate, $endDate, $reason) {
            $start = Carbon::parse($startDate);
            $end = Carbon::parse($endDate);
            $year = (int) $start->format('Y');

            if ($end->lessThan($start)) {
                throw ValidationException::withMessages([
                    'end_date' => ['End date cannot be earlier than start date.'],
                ]);
            }

            $totalDays = $start->diffInDays($end) + 1;

            // Find or auto-initialize leave balance
            $balance = $this->balanceRepository->findByEmployeeAndType($employeeId, $leaveTypeId, $year);
            if (!$balance) {
                $leaveType = $this->typeRepository->findOrFail($leaveTypeId);
                $balance = $this->balanceRepository->create([
                    'employee_id' => $employeeId,
                    'leave_type_id' => $leaveTypeId,
                    'year' => $year,
                    'entitled' => $leaveType->default_days,
                    'used' => 0,
                    'pending' => 0,
                    'remaining' => $leaveType->default_days,
                ]);
            }

            if ($balance->remaining < $totalDays) {
                throw ValidationException::withMessages([
                    'total_days' => ['Insufficient leave balance. Remaining days: ' . $balance->remaining],
                ]);
            }

            // Deduct from remaining, move to pending
            $this->balanceRepository->update($balance->id, [
                'remaining' => $balance->remaining - $totalDays,
                'pending' => $balance->pending + $totalDays,
            ]);

            return $this->requestRepository->create([
                'employee_id' => $employeeId,
                'leave_type_id' => $leaveTypeId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'total_days' => $totalDays,
                'reason' => $reason,
                'status' => 'pending',
            ]);
        });
    }

    public function approveRequest(string $requestId, string $approverId, ?string $comments): LeaveRequest
    {
        return DB::transaction(function () use ($requestId, $approverId, $comments) {
            $request = $this->requestRepository->findOrFail($requestId);

            if ($request->status !== 'pending') {
                throw ValidationException::withMessages([
                    'status' => ['Leave request is not in pending status.'],
                ]);
            }

            $year = (int) Carbon::parse($request->start_date)->format('Y');
            $balance = $this->balanceRepository->findByEmployeeAndType($request->employee_id, $request->leave_type_id, $year);

            if (!$balance) {
                throw ValidationException::withMessages([
                    'balance' => ['Leave balance record not found.'],
                ]);
            }

            // Create approval log
            $this->approvalRepository->create([
                'leave_request_id' => $requestId,
                'approver_id' => $approverId,
                'status' => 'approved',
                'comments' => $comments,
            ]);

            // Update balance: deduct from pending, add to used
            $this->balanceRepository->update($balance->id, [
                'pending' => max(0, $balance->pending - $request->total_days),
                'used' => $balance->used + $request->total_days,
            ]);

            // Update request status
            return $this->requestRepository->update($requestId, [
                'status' => 'approved',
            ]);
        });
    }

    public function rejectRequest(string $requestId, string $approverId, ?string $comments): LeaveRequest
    {
        return DB::transaction(function () use ($requestId, $approverId, $comments) {
            $request = $this->requestRepository->findOrFail($requestId);

            if ($request->status !== 'pending') {
                throw ValidationException::withMessages([
                    'status' => ['Leave request is not in pending status.'],
                ]);
            }

            $year = (int) Carbon::parse($request->start_date)->format('Y');
            $balance = $this->balanceRepository->findByEmployeeAndType($request->employee_id, $request->leave_type_id, $year);

            if (!$balance) {
                throw ValidationException::withMessages([
                    'balance' => ['Leave balance record not found.'],
                ]);
            }

            // Create approval log
            $this->approvalRepository->create([
                'leave_request_id' => $requestId,
                'approver_id' => $approverId,
                'status' => 'rejected',
                'comments' => $comments,
            ]);

            // Update balance: deduct from pending, add back to remaining
            $this->balanceRepository->update($balance->id, [
                'pending' => max(0, $balance->pending - $request->total_days),
                'remaining' => $balance->remaining + $request->total_days,
            ]);

            // Update request status
            return $this->requestRepository->update($requestId, [
                'status' => 'rejected',
            ]);
        });
    }
}
