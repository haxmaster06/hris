<?php

declare(strict_types=1);

namespace Modules\Training\Tests\Feature;

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
use Modules\Training\Models\Training;
use Modules\Training\Models\TrainingSession;
use Modules\Training\Models\TrainingParticipant;

class TrainingApiTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;
    private string $companyId;
    private string $branchId;
    private string $departmentId;
    private string $positionId;
    private Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        // Create tenant (which migrates and seeds tenant DB)
        $slug = 'trn' . strtolower(Str::random(8));
        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Training Test Tenant',
            'slug' => $slug,
        ]);

        $this->tenant->domains()->create([
            'domain' => $slug . '.local',
        ]);

        // Setup organization and employee data inside tenant
        tenancy()->initialize($this->tenant);
        
        $company = Company::factory()->create();
        $branch = Branch::factory()->create(['company_id' => $company->id]);
        $department = Department::factory()->create(['branch_id' => $branch->id]);
        $position = Position::factory()->create(['department_id' => $department->id]);
        
        $this->employee = Employee::factory()->create([
            'company_id' => $company->id,
            'branch_id' => $branch->id,
            'department_id' => $department->id,
            'position_id' => $position->id,
            'first_name' => 'Budy',
            'last_name' => 'Santoso',
            'employee_number' => 'EMP-000123',
            'status' => 'permanent',
        ]);

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

    public function test_can_manage_master_trainings(): void
    {
        $headers = $this->getAuthHeaders();

        // 1. Create Training
        $response = $this->postJson('/api/v1/trainings', [
            'name' => 'ISO 9001:2015 Lead Auditor',
            'code' => 'TRN-ISO-9001',
            'category' => 'Compliance',
            'type' => 'External',
            'description' => 'Quality management auditing certification.',
        ], $headers);

        $response->assertStatus(201)
            ->assertJsonPath('data.code', 'TRN-ISO-9001')
            ->assertJsonPath('data.category', 'Compliance');

        $trainingId = $response->json('data.id');

        // 2. Read Training
        $this->getJson("/api/v1/trainings/{$trainingId}", $headers)
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'ISO 9001:2015 Lead Auditor');

        // 3. Update Training
        $this->putJson("/api/v1/trainings/{$trainingId}", [
            'name' => 'ISO 9001 Lead Auditor Updated',
        ], $headers)
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'ISO 9001 Lead Auditor Updated');

        // 4. List Trainings
        $this->getJson('/api/v1/trainings', $headers)
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'name', 'code']]]);

        // 5. Delete Training
        $this->deleteJson("/api/v1/trainings/{$trainingId}", [], $headers)
            ->assertStatus(200);
    }

    public function test_can_manage_training_sessions_and_roster(): void
    {
        $headers = $this->getAuthHeaders();

        // Create a parent Master Training
        tenancy()->initialize($this->tenant);
        $training = Training::factory()->create([
            'category' => 'Technical',
            'type' => 'Internal',
        ]);
        tenancy()->end();

        // 1. Schedule/Create Training Session
        $response = $this->postJson('/api/v1/training-sessions', [
            'training_id' => $training->id,
            'trainer' => 'Dr. Jane Smith',
            'venue' => 'Main Auditorium Room B',
            'start_date' => now()->addDays(1)->toIso8601String(),
            'end_date' => now()->addDays(1)->addHours(8)->toIso8601String(),
            'status' => 'Scheduled',
        ], $headers);

        $response->assertStatus(201)
            ->assertJsonPath('data.trainer', 'Dr. Jane Smith')
            ->assertJsonPath('data.status', 'Scheduled');

        $sessionId = $response->json('data.id');

        // 2. Enroll Participant to Session Roster
        $enrollResponse = $this->postJson('/api/v1/training-participants', [
            'training_session_id' => $sessionId,
            'employee_id' => $this->employee->id,
            'attendance_status' => 'Pending',
            'result_status' => 'Pending',
        ], $headers);

        $enrollResponse->assertStatus(201)
            ->assertJsonPath('data.attendance_status', 'Pending');

        $participantId = $enrollResponse->json('data.id');

        // 3. Mark Attendance & Evaluate Performance (Passing Grade)
        $this->putJson("/api/v1/training-participants/{$participantId}", [
            'training_session_id' => $sessionId,
            'employee_id' => $this->employee->id,
            'attendance_status' => 'Attended',
            'result_status' => 'Pass',
            'score' => 92.50,
            'remarks' => 'Outstanding participation and scored highest on final test.',
        ], $headers)
            ->assertStatus(200)
            ->assertJsonPath('data.attendance_status', 'Attended')
            ->assertJsonPath('data.result_status', 'Pass')
            ->assertJsonPath('data.score', '92.50');

        // 4. List Participants of the Session
        $this->getJson("/api/v1/training-participants?training_session_id={$sessionId}", $headers)
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'attendance_status', 'score']]]);

        // 5. Clean up Session and Participant
        $this->deleteJson("/api/v1/training-participants/{$participantId}", [], $headers)
            ->assertStatus(200);

        $this->deleteJson("/api/v1/training-sessions/{$sessionId}", [], $headers)
            ->assertStatus(200);
    }
}
