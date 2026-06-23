<?php

declare(strict_types=1);

namespace Modules\Attendance\Services;

use Modules\Attendance\Repositories\AttendanceLogRepositoryInterface;
use Modules\Attendance\Repositories\EmployeeShiftRepositoryInterface;
use Modules\Attendance\Models\AttendanceLog;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class AttendanceService
{
    public function __construct(
        private readonly AttendanceLogRepositoryInterface $logRepository,
        private readonly EmployeeShiftRepositoryInterface $employeeShiftRepository
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->logRepository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function checkIn(string $employeeId, string $checkInTime, ?string $ip): AttendanceLog
    {
        return DB::transaction(function () use ($employeeId, $checkInTime, $ip) {
            $date = Carbon::parse($checkInTime)->toDateString();
            $timeString = Carbon::parse($checkInTime)->toTimeString();

            // Check if log already exists
            $existingLog = $this->logRepository->findLogByDate($employeeId, $date);
            if ($existingLog && $existingLog->check_in !== null) {
                throw ValidationException::withMessages([
                    'check_in' => ['Employee is already checked in for today.'],
                ]);
            }

            // Find active shift
            $activeEmployeeShift = $this->employeeShiftRepository->findActiveShift($employeeId, $date);
            if (!$activeEmployeeShift) {
                throw ValidationException::withMessages([
                    'shift' => ['No active shift assigned to employee on this date.'],
                ]);
            }

            $shift = $activeEmployeeShift->shift;
            $shiftStartTime = Carbon::parse($shift->start_time);
            $actualCheckInTime = Carbon::parse($timeString);

            // Calculate status based on late tolerance
            $toleranceLimit = $shiftStartTime->copy()->addMinutes($shift->late_tolerance);
            $status = 'present';
            if ($actualCheckInTime->greaterThan($toleranceLimit)) {
                $status = 'late';
            }

            if ($existingLog) {
                return $this->logRepository->update($existingLog->id, [
                    'check_in' => $timeString,
                    'check_in_ip' => $ip,
                    'status' => $status,
                ]);
            }

            return $this->logRepository->create([
                'employee_id' => $employeeId,
                'date' => $date,
                'check_in' => $timeString,
                'check_in_ip' => $ip,
                'status' => $status,
                'work_hours' => 0.00,
            ]);
        });
    }

    public function checkOut(string $employeeId, string $checkOutTime, ?string $ip): AttendanceLog
    {
        return DB::transaction(function () use ($employeeId, $checkOutTime, $ip) {
            $date = Carbon::parse($checkOutTime)->toDateString();
            $timeString = Carbon::parse($checkOutTime)->toTimeString();

            // Find existing log
            $existingLog = $this->logRepository->findLogByDate($employeeId, $date);
            if (!$existingLog || $existingLog->check_in === null) {
                throw ValidationException::withMessages([
                    'check_out' => ['No check-in record found for today.'],
                ]);
            }

            if ($existingLog->check_out !== null) {
                throw ValidationException::withMessages([
                    'check_out' => ['Employee is already checked out for today.'],
                ]);
            }

            // Find active shift
            $activeEmployeeShift = $this->employeeShiftRepository->findActiveShift($employeeId, $date);
            if (!$activeEmployeeShift) {
                throw ValidationException::withMessages([
                    'shift' => ['No active shift assigned to employee.'],
                ]);
            }

            $shift = $activeEmployeeShift->shift;
            $shiftEndTime = Carbon::parse($shift->end_time);
            $actualCheckOutTime = Carbon::parse($timeString);

            // Determine status (check if early leave)
            $status = $existingLog->status;
            if ($actualCheckOutTime->lessThan($shiftEndTime)) {
                if ($status !== 'late') {
                    $status = 'early_leave';
                }
            }

            // Calculate work hours
            $checkInDateTime = Carbon::parse($date . ' ' . $existingLog->check_in);
            $checkOutDateTime = Carbon::parse($date . ' ' . $timeString);
            
            // Handle shift crossing midnight if check_out is earlier than check_in (e.g. night shift)
            if ($checkOutDateTime->lessThan($checkInDateTime)) {
                $checkOutDateTime->addDay();
            }
            
            $workHours = round($checkOutDateTime->diffInMinutes($checkInDateTime, true) / 60, 2);

            return $this->logRepository->update($existingLog->id, [
                'check_out' => $timeString,
                'check_out_ip' => $ip,
                'status' => $status,
                'work_hours' => $workHours,
            ]);
        });
    }
}
