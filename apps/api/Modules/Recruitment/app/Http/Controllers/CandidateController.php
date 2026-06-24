<?php

declare(strict_types=1);

namespace Modules\Recruitment\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Recruitment\Http\Requests\CreateCandidateRequest;
use Modules\Recruitment\Http\Requests\UpdateCandidateRequest;
use Modules\Recruitment\Http\Resources\CandidateCollection;
use Modules\Recruitment\Http\Resources\CandidateResource;
use Modules\Recruitment\Services\CandidateService;

class CandidateController extends BaseController
{
    public function __construct(
        private readonly CandidateService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('recruitment.candidate.read');

        $candidates = $this->service->list($request->all());

        return $this->successResponse(
            new CandidateCollection($candidates),
            'Candidates retrieved successfully'
        );
    }

    public function store(CreateCandidateRequest $request): JsonResponse
    {
        Gate::authorize('recruitment.candidate.create');

        $candidate = $this->service->create($request->validated());

        return $this->createdResponse(
            new CandidateResource($candidate),
            'Candidate created successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('recruitment.candidate.read');

        $candidate = $this->service->findOrFail($id);

        return $this->successResponse(
            new CandidateResource($candidate),
            'Candidate retrieved successfully'
        );
    }

    public function update(UpdateCandidateRequest $request, string $id): JsonResponse
    {
        Gate::authorize('recruitment.candidate.update');

        $candidate = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new CandidateResource($candidate),
            'Candidate updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('recruitment.candidate.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Candidate deleted successfully'
        );
    }
}
