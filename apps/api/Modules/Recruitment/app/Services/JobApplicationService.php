<?php

declare(strict_types=1);

namespace Modules\Recruitment\Services;

use Modules\Recruitment\Repositories\JobApplicationRepositoryInterface;
use Modules\Recruitment\Repositories\HiringApprovalRepositoryInterface;
use Modules\Recruitment\Models\JobApplication;
use Modules\Organization\Models\Branch;
use Modules\Organization\Models\Department;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JobApplicationService
{
    public function __construct(
        private readonly JobApplicationRepositoryInterface $repository,
        private readonly HiringApprovalRepositoryInterface $approvalRepository
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findOrFail(string $id): JobApplication
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): JobApplication
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['applied_date'])) {
                $data['applied_date'] = now()->toDateString();
            }
            return $this->repository->create($data);
        });
    }

    public function update(string $id, array $data): JobApplication
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
     * Move job application stage in the pipeline
     */
    public function moveStage(string $id, string $status): JobApplication
    {
        return DB::transaction(function () use ($id, $status) {
            $application = $this->repository->findOrFail($id);
            $oldStatus = $application->status;

            // Validate status change (basic validation)
            $validStatuses = ['applied', 'screening', 'interview', 'assessment', 'offering', 'hiring', 'hired', 'rejected'];
            if (!in_array($status, $validStatuses, true)) {
                throw new \InvalidArgumentException("Invalid stage status: {$status}");
            }

            // Update application status
            $application = $this->repository->update($id, ['status' => $status]);

            // If stage is moved to 'hiring', initialize the multi-stage approval flow starting at 'hr'
            if ($status === 'hiring' && $oldStatus !== 'hiring') {
                $this->initializeHiringApprovals($application);
            }

            return $application;
        });
    }

    /**
     * Initialize hiring approvals: start with 'hr' stage.
     */
    private function initializeHiringApprovals(JobApplication $application): void
    {
        // Check if there is already an active or pending approval
        $existing = $application->approvals()->where('stage', 'hr')->first();
        if (!$existing) {
            // Get a default HR User or use the logged in user as the initial approver placeholder
            $approverId = auth()->id() ?? User::first()?->id;

            if ($approverId) {
                $this->approvalRepository->create([
                    'job_application_id' => $application->id,
                    'approver_id' => $approverId,
                    'stage' => 'hr',
                    'status' => 'pending',
                ]);
            }
        }
    }

    /**
     * Create employee record in database automatically
     */
    public function createEmployeeFromApplication(JobApplication $application): void
    {
        $candidate = $application->candidate;
        $vacancy = $application->vacancy;

        // Resolve branch_id
        $branchId = $vacancy->branch_id;
        if (!$branchId) {
            $branch = Branch::where('company_id', $vacancy->company_id)->first();
            $branchId = $branch ? $branch->id : null;
        }

        // Resolve department_id
        $departmentId = $vacancy->department_id;
        if (!$departmentId) {
            $dept = Department::where('company_id', $vacancy->company_id)->first();
            $departmentId = $dept ? $dept->id : null;
        }

        // Generate unique employee number
        $employeeNumber = $this->generateUniqueEmployeeNumber();

        // Create Employee via EmployeeService
        $employeeService = app(\Modules\Employee\Services\EmployeeService::class);

        $employeeService->create([
            'company_id' => $vacancy->company_id,
            'branch_id' => $branchId,
            'department_id' => $departmentId,
            'position_id' => $vacancy->position_id,
            'employee_number' => $employeeNumber,
            'first_name' => $candidate->first_name,
            'last_name' => $candidate->last_name,
            'gender' => 'male', // default value
            'birth_date' => now()->subYears(25)->toDateString(), // placeholder
            'join_date' => now()->toDateString(),
            'status' => 'probation',
        ]);
    }

    /**
     * Helper to generate unique employee number
     */
    private function generateUniqueEmployeeNumber(): string
    {
        $employeeModelClass = \Modules\Employee\Models\Employee::class;
        do {
            $number = 'EMP-' . str_pad((string) mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
            $exists = $employeeModelClass::where('employee_number', $number)->exists();
        } while ($exists);

        return $number;
    }
}
