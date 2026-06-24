<?php

declare(strict_types=1);

namespace Modules\Certification\Tests\Feature;

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
use Modules\Certification\Models\Certification;
use Modules\Certification\Models\CertificationRequirement;
use Modules\Certification\Models\EmployeeCertification;

class CertificationApiTest extends TestCase
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
        $slug = 'crt' . strtolower(Str::random(8));
        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Certification Test Tenant',
            'slug' => $slug,
        ]);

        $this->tenant->domains()->create([
            'domain' => $slug . '.local',
        ]);

        // Setup organization data inside tenant
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

        if ($response->status() !== 200) {
            dump($response->json());
        }

        $token = $response->json('data.access_token');

        return [
            'X-Tenant-ID' => $this->tenantId,
            'Authorization' => 'Bearer ' . $token,
        ];
    }

    public function test_can_manage_master_certifications(): void
    {
        $headers = $this->getAuthHeaders();

        // 1. Create Master Certification
        $response = $this->postJson('/api/v1/certifications', [
            'name' => 'Certified Scrum Master',
            'code' => 'CERT-CSM',
            'issuer' => 'Scrum Alliance',
            'validity_period' => 24, // 24 months
        ], $headers);

        $response->assertStatus(201)
            ->assertJsonPath('data.code', 'CERT-CSM')
            ->assertJsonPath('data.validity_period', 24);

        $certId = $response->json('data.id');

        // 2. Read Certification
        $this->getJson("/api/v1/certifications/{$certId}", $headers)
            ->assertStatus(200)
            ->assertJsonPath('data.issuer', 'Scrum Alliance');

        // 3. Update Certification
        $this->putJson("/api/v1/certifications/{$certId}", [
            'issuer' => 'Scrum Alliance Updated',
        ], $headers)
            ->assertStatus(200)
            ->assertJsonPath('data.issuer', 'Scrum Alliance Updated');

        // 4. Delete Certification
        $this->deleteJson("/api/v1/certifications/{$certId}", [], $headers)
            ->assertStatus(200);
    }

    public function test_can_manage_certification_compliance_requirements(): void
    {
        $headers = $this->getAuthHeaders();

        // Setup master certification inside tenant
        tenancy()->initialize($this->tenant);
        $certification = Certification::factory()->create();
        tenancy()->end();

        // 1. Map Position Mandatory Certification
        $response = $this->postJson('/api/v1/certification-requirements', [
            'position_id' => $this->positionId,
            'certification_id' => $certification->id,
            'is_mandatory' => true,
        ], $headers);

        $response->assertStatus(201)
            ->assertJsonPath('data.is_mandatory', true);

        $reqId = $response->json('data.id');

        // 2. List requirements
        $this->getJson('/api/v1/certification-requirements', $headers)
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'position_id', 'certification_id', 'is_mandatory']]]);

        // 3. Delete Mapping
        $this->deleteJson("/api/v1/certification-requirements/{$reqId}", [], $headers)
            ->assertStatus(200);
    }

    public function test_can_log_and_update_employee_certifications(): void
    {
        $headers = $this->getAuthHeaders();

        // Setup master certification inside tenant
        tenancy()->initialize($this->tenant);
        $certification = Certification::factory()->create();
        tenancy()->end();

        // 1. Log Employee Certificate (issue date: today, expired date: in 12 months)
        $response = $this->postJson('/api/v1/employee-certifications', [
            'employee_id' => $this->employee->id,
            'certification_id' => $certification->id,
            'certificate_number' => 'CERT-NO-8921-22A',
            'issue_date' => now()->toDateString(),
            'expired_date' => now()->addMonths(12)->toDateString(),
        ], $headers);

        $response->assertStatus(201)
            ->assertJsonPath('data.certificate_number', 'CERT-NO-8921-22A')
            ->assertJsonPath('data.status', 'Active');

        $empCertId = $response->json('data.id');

        // 2. Update Employee Certificate details
        $this->putJson("/api/v1/employee-certifications/{$empCertId}", [
            'employee_id' => $this->employee->id,
            'certification_id' => $certification->id,
            'certificate_number' => 'CERT-NO-8921-22A-REV1',
            'issue_date' => now()->toDateString(),
            'expired_date' => now()->addMonths(12)->toDateString(),
        ], $headers)
            ->assertStatus(200)
            ->assertJsonPath('data.certificate_number', 'CERT-NO-8921-22A-REV1');

        // 3. Get list
        $this->getJson('/api/v1/employee-certifications', $headers)
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'certificate_number', 'status']]]);

        // 4. Delete Log
        $this->deleteJson("/api/v1/employee-certifications/{$empCertId}", [], $headers)
            ->assertStatus(200);
    }
}
