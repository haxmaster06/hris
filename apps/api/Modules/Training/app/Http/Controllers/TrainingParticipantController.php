<?php

declare(strict_types=1);

namespace Modules\Training\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Training\Http\Requests\EnrollParticipantRequest;
use Modules\Training\Http\Resources\TrainingParticipantResource;
use Modules\Training\Services\TrainingParticipantService;

class TrainingParticipantController extends BaseController
{
    public function __construct(
        private readonly TrainingParticipantService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('training.read');

        $participants = $this->service->listParticipants($request->all());

        return $this->successResponse(
            TrainingParticipantResource::collection($participants),
            'Participants retrieved successfully'
        );
    }

    public function store(EnrollParticipantRequest $request): JsonResponse
    {
        Gate::authorize('training.create');

        $participant = $this->service->enroll($request->validated());

        return $this->createdResponse(
            new TrainingParticipantResource($participant->load(['session.training', 'employee'])),
            'Participant enrolled successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('training.read');

        $participant = $this->service->findParticipant($id);

        return $this->successResponse(
            new TrainingParticipantResource($participant->load(['session.training', 'employee'])),
            'Participant retrieved successfully'
        );
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('training.update');

        $validated = $request->validate([
            'attendance_status' => ['nullable', 'string', 'in:Pending,Attended,Absent'],
            'result_status' => ['nullable', 'string', 'in:Pending,Pass,Fail'],
            'score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'remarks' => ['nullable', 'string'],
        ]);

        $participant = $this->service->findParticipant($id);
        
        // Update fields if provided
        $updateData = [];
        if ($request->has('attendance_status')) {
            $updateData['attendance_status'] = $validated['attendance_status'];
        }
        if ($request->has('result_status')) {
            $updateData['result_status'] = $validated['result_status'];
        }
        if ($request->has('score')) {
            $updateData['score'] = $validated['score'];
        }
        if ($request->has('remarks')) {
            $updateData['remarks'] = $validated['remarks'];
        }

        $participant->update($updateData);

        return $this->successResponse(
            new TrainingParticipantResource($participant->fresh(['session.training', 'employee'])),
            'Participant updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('training.delete');

        $this->service->removeParticipant($id);

        return $this->successResponse(
            null,
            'Participant removed successfully'
        );
    }
}
