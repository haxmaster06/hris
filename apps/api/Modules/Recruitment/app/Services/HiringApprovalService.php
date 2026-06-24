<?php

declare(strict_types=1);

namespace Modules\Recruitment\Services;

use Modules\Recruitment\Repositories\HiringApprovalRepositoryInterface;
use Modules\Recruitment\Models\HiringApproval;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class HiringApprovalService
{
    public function __construct(
        private readonly HiringApprovalRepositoryInterface $repository,
        private readonly JobApplicationService $applicationService
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findOrFail(string $id): HiringApproval
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): HiringApproval
    {
        return DB::transaction(function () use ($data) {
            return $this->repository->create($data);
        });
    }

    public function update(string $id, array $data): HiringApproval
    {
        return DB::transaction(function () use ($id, $data) {
            return $this->repository->update($id, $data);
        });
    }

    public function delete(string $id): bool
    {
        return DB::transaction(function () use ($id) {
            return $this->repository->delete($id);
        });
    }

    /**
     * Approve the hiring stage
     */
    public function approve(string $id, ?string $comments = null): HiringApproval
    {
        return DB::transaction(function () use ($id, $comments) {
            $approval = $this->repository->findOrFail($id);
            $application = $approval->application;

            // Update this approval stage to approved
            $approval = $this->repository->update($id, [
                'status' => 'approved',
                'comments' => $comments,
            ]);

            // Determine next stage
            $nextStage = null;
            if ($approval->stage === 'hr') {
                $nextStage = 'manager';
            } elseif ($approval->stage === 'manager') {
                $nextStage = 'director';
            }

            if ($nextStage) {
                // Get next approver (fallback to current user or first user)
                $approverId = auth()->id() ?? User::first()?->id;

                if ($approverId) {
                    $this->repository->create([
                        'job_application_id' => $application->id,
                        'approver_id' => $approverId,
                        'stage' => $nextStage,
                        'status' => 'pending',
                    ]);
                }
            } else {
                // Director approved (final stage)
                // 1. Move JobApplication status to 'hired'
                $this->applicationService->update($application->id, ['status' => 'hired']);

                // 2. Trigger automatic creation of Employee record
                $this->applicationService->createEmployeeFromApplication($application);
            }

            return $approval;
        });
    }

    /**
     * Reject the hiring stage
     */
    public function reject(string $id, ?string $comments = null): HiringApproval
    {
        return DB::transaction(function () use ($id, $comments) {
            $approval = $this->repository->findOrFail($id);
            $application = $approval->application;

            // Update this approval stage to rejected
            $approval = $this->repository->update($id, [
                'status' => 'rejected',
                'comments' => $comments,
            ]);

            // Set job application status to rejected
            $this->applicationService->update($application->id, ['status' => 'rejected']);

            return $approval;
        });
    }
}
