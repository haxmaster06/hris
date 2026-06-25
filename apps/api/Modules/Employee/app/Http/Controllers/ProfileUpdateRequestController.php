<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Employee\Models\ProfileUpdateRequest;
use Modules\Employee\Models\Employee;

class ProfileUpdateRequestController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('profile_update.view');

        $query = ProfileUpdateRequest::with(['employee']);

        $user = auth()->user();
        if (!$user->hasRole(['Super Admin', 'HR Admin', 'HR Manager'])) {
            $employee = Employee::where('user_id', $user->id)->first();
            if ($employee) {
                $query->where('employee_id', $employee->id);
            } else {
                $query->where('employee_id', '00000000-0000-0000-0000-000000000000');
            }
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return $this->successResponse($query->latest()->get(), 'Profile update requests retrieved');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'field_name' => ['required', 'string'],
            'new_value' => ['required', 'string'],
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        
        $user = auth()->user();
        if (!$user->hasRole(['Super Admin', 'HR Admin', 'HR Manager']) && $employee->user_id !== $user->id) {
            return $this->errorResponse('Access denied', 403);
        }

        $oldValue = $employee->getAttribute($validated['field_name']);

        $req = ProfileUpdateRequest::create([
            'employee_id' => $validated['employee_id'],
            'field_name' => $validated['field_name'],
            'old_value' => is_scalar($oldValue) ? (string) $oldValue : json_encode($oldValue),
            'new_value' => $validated['new_value'],
            'status' => 'pending',
        ]);

        return $this->createdResponse($req, 'Profile update request submitted successfully');
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        Gate::authorize('profile_update.approve');

        $req = ProfileUpdateRequest::findOrFail($id);
        if ($req->status !== 'pending') {
            return $this->errorResponse('Request is already processed', 400);
        }

        $approver = Employee::where('user_id', auth()->id())->first();

        \DB::transaction(function () use ($req, $approver, $request) {
            $employee = Employee::findOrFail($req->employee_id);
            
            $employee->update([
                $req->field_name => $req->new_value
            ]);

            $req->update([
                'status' => 'approved',
                'approved_by' => $approver?->id,
                'comments' => $request->input('comments'),
            ]);
        });

        return $this->successResponse($req->fresh(), 'Profile update request approved');
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        Gate::authorize('profile_update.approve');

        $req = ProfileUpdateRequest::findOrFail($id);
        if ($req->status !== 'pending') {
            return $this->errorResponse('Request is already processed', 400);
        }

        $approver = Employee::where('user_id', auth()->id())->first();

        $req->update([
            'status' => 'rejected',
            'approved_by' => $approver?->id,
            'comments' => $request->input('comments'),
        ]);

        return $this->successResponse($req, 'Profile update request rejected');
    }
}
