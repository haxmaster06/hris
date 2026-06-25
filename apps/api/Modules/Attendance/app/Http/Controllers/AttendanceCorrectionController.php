<?php

declare(strict_types=1);

namespace Modules\Attendance\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Modules\Attendance\Models\AttendanceCorrection;
use Modules\Attendance\Models\AttendanceLog;
use Carbon\Carbon;

class AttendanceCorrectionController extends BaseController
{
    /**
     * List all correction requests.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('attendance_correction.view');

        $query = AttendanceCorrection::query()->with(['employee', 'approver']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $corrections = $query->latest()->paginate($request->integer('per_page', 15));

        return $this->successResponse($corrections, 'Attendance corrections retrieved successfully.');
    }

    /**
     * Submit new correction request.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('attendance_correction.create');

        $validated = $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'original_check_in' => 'nullable|date',
            'original_check_out' => 'nullable|date',
            'corrected_check_in' => 'nullable|date',
            'corrected_check_out' => 'nullable|date',
            'reason' => 'required|string',
        ]);

        $correction = AttendanceCorrection::create($validated);

        return $this->createdResponse($correction, 'Attendance correction request submitted successfully.');
    }

    /**
     * View correction request details.
     */
    public function show(string $id): JsonResponse
    {
        Gate::authorize('attendance_correction.view');

        $correction = AttendanceCorrection::with(['employee', 'approver'])->findOrFail($id);

        return $this->successResponse($correction, 'Attendance correction retrieved successfully.');
    }

    /**
     * Process (approve/reject) correction request.
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        Gate::authorize('attendance_correction.approve');

        $correction = AttendanceCorrection::findOrFail($id);

        if ($correction->status !== 'pending') {
            return response()->json(['message' => 'This correction request is already processed.'], 422);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:approved,rejected',
            'approved_by' => 'required|uuid|exists:employees,id',
        ]);

        DB::transaction(function () use ($correction, $validated) {
            $correction->update([
                'status' => $validated['status'],
                'approved_by' => $validated['approved_by'],
            ]);

            if ($validated['status'] === 'approved') {
                $targetDate = Carbon::parse($correction->corrected_check_in ?? $correction->corrected_check_out)->toDateString();
                
                // Find or create attendance log
                $log = AttendanceLog::firstOrNew([
                    'employee_id' => $correction->employee_id,
                    'date' => $targetDate,
                ]);

                if ($correction->corrected_check_in) {
                    $log->check_in = $correction->corrected_check_in;
                }
                if ($correction->corrected_check_out) {
                    $log->check_out = $correction->corrected_check_out;
                }

                // If check-in and check-out are set, compute work_hours
                if ($log->check_in && $log->check_out) {
                    $in = Carbon::parse($log->check_in);
                    $out = Carbon::parse($log->check_out);
                    $log->work_hours = round($out->diffInMinutes($in) / 60, 2);
                    $log->status = 'Present'; // Set present status on correction approval
                }

                $log->save();
            }
        });

        return $this->successResponse($correction->fresh(['employee', 'approver']), 'Attendance correction request processed successfully.');
    }
}
