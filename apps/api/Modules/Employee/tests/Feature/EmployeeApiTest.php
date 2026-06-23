<?php

declare(strict_types=1);

namespace Modules\Employee\Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Organization\Models\Company;
use Modules\Organization\Models\Branch;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Position;
use Modules\Employee\Models\Employee;
use Modules\Employee\Models\EmployeeHistory;

class EmployeeApiTest extends TestCase
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

        // Create tenant
        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Employee Test Tenant',
            'slug' => 'employeetest',
        ]);

        $this->tenant->domains()->create([
            'domain' => 'employeetest.local',
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

    public function test_can_list_employees(): void
    {
        tenancy()->initialize($this->tenant);
        Employee::factory()->create([
            'company_id' => $this->companyId,
            'branch_id' => $this->branchId,
            'department_id' => $this->departmentId,
            'position_id' => $this->positionId,
        ]);
        tenancy()->end();

        $headers = $this->getAuthHeaders();
        $response = $this->getJson('/api/v1/employees', $headers);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'data' => [
                        '*' => ['id', 'first_name', 'last_name', 'employee_number', 'status']
                    ]
                ]
            ]);
    }

    public function test_can_create_employee(): void
    {
        $headers = $this->getAuthHeaders();

        $employeeData = [
            'company_id' => $this->companyId,
            'branch_id' => $this->branchId,
            'department_id' => $this->departmentId,
            'position_id' => $this->positionId,
            'employee_number' => 'EMP-000099',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'gender' => 'male',
            'birth_date' => '1995-05-15',
            'join_date' => '2025-01-10',
            'status' => 'probation',
        ];

        $response = $this->postJson('/api/v1/employees', $employeeData, $headers);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.first_name', 'John')
            ->assertJsonPath('data.employee_number', 'EMP-000099');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('employees', [
            'employee_number' => 'EMP-000099',
            'first_name' => 'John'
        ]);

        // Also check if initial history record was logged
        $employee = Employee::where('employee_number', 'EMP-000099')->first();
        $this->assertDatabaseHas('employee_histories', [
            'employee_id' => $employee->id,
            'type' => 'employment_created',
            'new_value' => 'probation',
        ]);
        tenancy()->end();
    }

    public function test_can_update_employee_and_trigger_history_logging(): void
    {
        tenancy()->initialize($this->tenant);
        $employee = Employee::factory()->create([
            'company_id' => $this->companyId,
            'branch_id' => $this->branchId,
            'department_id' => $this->departmentId,
            'position_id' => $this->positionId,
            'status' => 'probation',
        ]);
        $employeeId = $employee->id;

        // Create new position for promotion testing
        $newPosition = Position::factory()->create(['department_id' => $this->departmentId]);
        $newPositionId = $newPosition->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $updateData = [
            'company_id' => $this->companyId,
            'branch_id' => $this->branchId,
            'department_id' => $this->departmentId,
            'position_id' => $newPositionId, // promotion/position change
            'employee_number' => $employee->employee_number,
            'first_name' => $employee->first_name,
            'gender' => $employee->gender,
            'birth_date' => $employee->birth_date->toDateString(),
            'join_date' => $employee->join_date->toDateString(),
            'status' => 'permanent', // status change
        ];

        $response = $this->putJson("/api/v1/employees/{$employeeId}", $updateData, $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'permanent')
            ->assertJsonPath('data.position_id', $newPositionId);

        tenancy()->initialize($this->tenant);
        // Verify update in DB
        $this->assertDatabaseHas('employees', [
            'id' => $employeeId,
            'status' => 'permanent',
            'position_id' => $newPositionId
        ]);

        // Verify history logs
        $this->assertDatabaseHas('employee_histories', [
            'employee_id' => $employeeId,
            'type' => 'promotion',
            'field' => 'position_id',
            'old_value' => $this->positionId,
            'new_value' => $newPositionId
        ]);

        $this->assertDatabaseHas('employee_histories', [
            'employee_id' => $employeeId,
            'type' => 'status_change',
            'field' => 'status',
            'old_value' => 'probation',
            'new_value' => 'permanent'
        ]);
        tenancy()->end();
    }

    public function test_can_read_employee_histories(): void
    {
        tenancy()->initialize($this->tenant);
        $employee = Employee::factory()->create([
            'company_id' => $this->companyId,
            'branch_id' => $this->branchId,
            'department_id' => $this->departmentId,
            'position_id' => $this->positionId,
        ]);
        $employeeId = $employee->id;

        // Log manual history log
        EmployeeHistory::create([
            'employee_id' => $employeeId,
            'type' => 'status_change',
            'field' => 'status',
            'old_value' => 'probation',
            'new_value' => 'permanent',
            'effective_date' => now()->toDateString(),
        ]);
        tenancy()->end();

        $headers = $this->getAuthHeaders();
        $response = $this->getJson("/api/v1/employees/{$employeeId}/histories", $headers);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => ['id', 'employee_id', 'type', 'field', 'old_value', 'new_value', 'effective_date']
                    ]
                ]
            ]);
    }

    public function test_can_soft_delete_employee(): void
    {
        tenancy()->initialize($this->tenant);
        $employee = Employee::factory()->create([
            'company_id' => $this->companyId,
            'branch_id' => $this->branchId,
            'department_id' => $this->departmentId,
            'position_id' => $this->positionId,
        ]);
        $employeeId = $employee->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $response = $this->deleteJson("/api/v1/employees/{$employeeId}", [], $headers);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Employee deleted successfully');

        tenancy()->initialize($this->tenant);
        $this->assertSoftDeleted('employees', ['id' => $employeeId]);
        tenancy()->end();
    }
}
