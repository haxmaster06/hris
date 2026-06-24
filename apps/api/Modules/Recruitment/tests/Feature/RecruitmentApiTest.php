<?php

declare(strict_types=1);

namespace Modules\Recruitment\Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Organization\Models\Company;
use Modules\Organization\Models\Branch;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Position;
use Modules\Employee\Models\Employee;
use Modules\Recruitment\Models\Vacancy;
use Modules\Recruitment\Models\Candidate;
use Modules\Recruitment\Models\JobApplication;
use Modules\Recruitment\Models\Interview;
use Modules\Recruitment\Models\HiringApproval;

class RecruitmentApiTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;
    private string $companyId;
    private string $branchId;
    private string $departmentId;
    private string $positionId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        // Create tenant (which migrates and seeds tenant DB)
        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Recruitment Test Tenant',
            'slug' => 'recruitmenttest',
        ]);

        $this->tenant->domains()->create([
            'domain' => 'recruitmenttest.local',
        ]);

        // Setup organization data inside tenant
        tenancy()->initialize($this->tenant);
        $company = Company::factory()->create();
        $branch = Branch::factory()->create(['company_id' => $company->id]);
        $department = Department::factory()->create(['branch_id' => $branch->id]);
        $position = Position::factory()->create(['department_id' => $department->id]);

        $this->companyId = $company->id;
        $this->branchId = $branch->id;
        $this->departmentId = $department->id;
        $this->positionId = $position->id;
        tenancy()->end();
    }

    private function getAuthHeaders(): array
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@nexushr.local',
            'password' => 'admin123',
        ], [
            'X-Tenant-ID' => $this->tenantId,
        ]);

        $token = $response->json('data.access_token');

        return [
            'X-Tenant-ID' => $this->tenantId,
            'Authorization' => 'Bearer ' . $token,
        ];
    }

    public function test_can_manage_vacancies(): void
    {
        $headers = $this->getAuthHeaders();

        // 1. Create Vacancy
        $response = $this->postJson('/api/v1/vacancies', [
            'company_id' => $this->companyId,
            'branch_id' => $this->branchId,
            'department_id' => $this->departmentId,
            'position_id' => $this->positionId,
            'title' => 'Software Engineer PHP',
            'description' => 'We need a PHP developer.',
            'requirements' => 'Laravel experience.',
            'slots' => 2,
            'status' => 'draft',
        ], $headers);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Software Engineer PHP')
            ->assertJsonPath('data.status', 'draft');

        $vacancyId = $response->json('data.id');

        // 2. Publish Vacancy
        $pubResponse = $this->postJson("/api/v1/vacancies/{$vacancyId}/publish", [], $headers);
        $pubResponse->assertStatus(200)
            ->assertJsonPath('data.status', 'published');

        // 3. Close Vacancy
        $closeResponse = $this->postJson("/api/v1/vacancies/{$vacancyId}/close", [], $headers);
        $closeResponse->assertStatus(200)
            ->assertJsonPath('data.status', 'closed');

        // 4. Update Vacancy
        $updateResponse = $this->putJson("/api/v1/vacancies/{$vacancyId}", [
            'title' => 'Senior Developer',
        ], $headers);
        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.title', 'Senior Developer');

        // 5. Delete Vacancy
        $deleteResponse = $this->deleteJson("/api/v1/vacancies/{$vacancyId}", [], $headers);
        $deleteResponse->assertStatus(200);
    }

    public function test_can_manage_candidates(): void
    {
        $headers = $this->getAuthHeaders();

        // 1. Create Candidate
        $response = $this->postJson('/api/v1/candidates', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'phone' => '08123456789',
            'resume_path' => 'resumes/john_doe.pdf',
        ], $headers);

        $response->assertStatus(201)
            ->assertJsonPath('data.first_name', 'John')
            ->assertJsonPath('data.email', 'john.doe@example.com');

        $candidateId = $response->json('data.id');

        // 2. List Candidates
        $listResponse = $this->getJson('/api/v1/candidates', $headers);
        $listResponse->assertStatus(200)
            ->assertJsonStructure(['data' => ['data' => [['id', 'first_name', 'email']]]]);

        // 3. Update Candidate
        $updateResponse = $this->putJson("/api/v1/candidates/{$candidateId}", [
            'last_name' => 'Smith',
        ], $headers);
        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.last_name', 'Smith');

        // 4. Delete Candidate
        $deleteResponse = $this->deleteJson("/api/v1/candidates/{$candidateId}", [], $headers);
        $deleteResponse->assertStatus(200);
    }

    public function test_hiring_approval_workflow_and_employee_onboarding(): void
    {
        $headers = $this->getAuthHeaders();

        // Prepare vacancy and candidate inside tenant
        tenancy()->initialize($this->tenant);
        $vacancy = Vacancy::factory()->create([
            'company_id' => $this->companyId,
            'branch_id' => $this->branchId,
            'department_id' => $this->departmentId,
            'position_id' => $this->positionId,
            'title' => 'QA Analyst',
            'status' => 'published',
        ]);
        $candidate = Candidate::factory()->create([
            'first_name' => 'Alice',
            'last_name' => 'Wunderland',
            'email' => 'alice@wunderland.local',
        ]);
        tenancy()->end();

        // 1. Create Job Application (Applied stage)
        $response = $this->postJson('/api/v1/applications', [
            'vacancy_id' => $vacancy->id,
            'candidate_id' => $candidate->id,
            'status' => 'applied',
        ], $headers);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'applied');

        $applicationId = $response->json('data.id');

        // 2. Move to Screening
        $this->postJson("/api/v1/applications/{$applicationId}/move-stage", ['status' => 'screening'], $headers)
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'screening');

        // 3. Move to Interview and schedule an interview
        $this->postJson("/api/v1/applications/{$applicationId}/move-stage", ['status' => 'interview'], $headers)
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'interview');

        // Get default admin user id to act as interviewer
        tenancy()->initialize($this->tenant);
        $interviewer = User::first();
        tenancy()->end();

        $schedResponse = $this->postJson('/api/v1/interviews', [
            'job_application_id' => $applicationId,
            'interview_date' => now()->addDays(2)->format('Y-m-d H:i:s'),
            'interviewer_id' => $interviewer->id,
            'notes' => 'Initial screening chat',
            'status' => 'scheduled',
        ], $headers);

        $schedResponse->assertStatus(201);
        $interviewId = $schedResponse->json('data.id');

        // Submit interview scoring/results
        $this->postJson("/api/v1/interviews/{$interviewId}/submit-result", [
            'score' => 90,
            'notes' => 'Excellent communication skills.',
        ], $headers)
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.score', 90);

        // 4. Move to Hiring stage (this initializes the HR approval entry)
        $hiringResponse = $this->postJson("/api/v1/applications/{$applicationId}/move-stage", ['status' => 'hiring'], $headers);
        $hiringResponse->assertStatus(200)
            ->assertJsonPath('data.status', 'hiring');

        // Get the HR approval ID
        tenancy()->initialize($this->tenant);
        $hrApproval = HiringApproval::where('job_application_id', $applicationId)
            ->where('stage', 'hr')
            ->firstOrFail();
        tenancy()->end();

        // 5. Approve HR Stage (this will automatically spawn Manager stage)
        $this->postJson("/api/v1/hiring-approvals/{$hrApproval->id}/approve", [
            'comments' => 'HR criteria met.',
        ], $headers)
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');

        // Get Manager approval ID
        tenancy()->initialize($this->tenant);
        $managerApproval = HiringApproval::where('job_application_id', $applicationId)
            ->where('stage', 'manager')
            ->firstOrFail();
        tenancy()->end();

        // 6. Approve Manager Stage (this will automatically spawn Director stage)
        $this->postJson("/api/v1/hiring-approvals/{$managerApproval->id}/approve", [
            'comments' => 'Team fit confirmed.',
        ], $headers)
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');

        // Get Director approval ID
        tenancy()->initialize($this->tenant);
        $directorApproval = HiringApproval::where('job_application_id', $applicationId)
            ->where('stage', 'director')
            ->firstOrFail();
        tenancy()->end();

        // 7. Approve Director Stage (final stage, should trigger status hired & auto employee creation)
        $this->postJson("/api/v1/hiring-approvals/{$directorApproval->id}/approve", [
            'comments' => 'Approved to hire.',
        ], $headers)
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');

        // Verify application status updated to hired
        $appCheck = $this->getJson("/api/v1/applications/{$applicationId}?include=vacancy,candidate", $headers);
        $appCheck->assertStatus(200)
            ->assertJsonPath('data.status', 'hired');

        // Verify employee record created successfully with corresponding values
        tenancy()->initialize($this->tenant);
        $employee = Employee::where('first_name', 'Alice')
            ->where('last_name', 'Wunderland')
            ->first();
        $this->assertNotNull($employee);
        $this->assertEquals($vacancy->position_id, $employee->position_id);
        $this->assertEquals('probation', $employee->status);
        $this->assertStringStartsWith('EMP-', $employee->employee_number);
        tenancy()->end();
    }
}
