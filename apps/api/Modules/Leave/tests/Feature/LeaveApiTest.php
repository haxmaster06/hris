<?php

declare(strict_types=1);

namespace Modules\Leave\Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Leave\Models\LeaveType;
use Modules\Leave\Models\LeaveBalance;
use Modules\Leave\Models\LeaveRequest;
use Modules\Employee\Models\Employee;

class LeaveApiTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;
    private string $employeeId;
    private string $leaveTypeId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        // Create tenant
        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Leave Test Tenant',
            'slug' => 'leavetest',
        ]);

        tenancy()->initialize($this->tenant);

        // Create employee
        $employee = Employee::factory()->create();
        $this->employeeId = $employee->id;

        // Create leave type
        $leaveType = LeaveType::factory()->create([
            'name' => 'Annual Leave',
            'code' => 'ANNUAL-LV',
            'default_days' => 12,
        ]);
        $this->leaveTypeId = $leaveType->id;

        // Initialize leave balance for employee
        LeaveBalance::factory()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'year' => (int) date('Y'),
            'entitled' => 12,
            'used' => 0,
            'pending' => 0,
            'remaining' => 12,
        ]);

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

    public function test_can_list_leave_types(): void
    {
        $headers = $this->getAuthHeaders();
        $response = $this->getJson('/api/v1/leave-types', $headers);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => ['id', 'name', 'code', 'default_days', 'is_paid']
                    ]
                ]
            ]);
    }

    public function test_can_submit_leave_request(): void
    {
        $headers = $this->getAuthHeaders();

        $startDate = now()->addDays(2)->toDateString();
        $endDate = now()->addDays(4)->toDateString(); // 3 days total

        $requestData = [
            'employee_id' => $this->employeeId,
            'leave_type_id' => $this->leaveTypeId,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'reason' => 'Need rest',
        ];

        $response = $this->postJson('/api/v1/leave-requests', $requestData, $headers);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_days', 3)
            ->assertJsonPath('data.status', 'pending');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('leave_requests', [
            'employee_id' => $this->employeeId,
            'total_days' => 3,
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('leave_balances', [
            'employee_id' => $this->employeeId,
            'leave_type_id' => $this->leaveTypeId,
            'remaining' => 9,
            'pending' => 3,
        ]);
        tenancy()->end();
    }

    public function test_can_approve_leave_request(): void
    {
        // 1. Submit a request first
        tenancy()->initialize($this->tenant);
        $request = LeaveRequest::factory()->create([
            'employee_id' => $this->employeeId,
            'leave_type_id' => $this->leaveTypeId,
            'start_date' => now()->addDays(2)->toDateString(),
            'end_date' => now()->addDays(4)->toDateString(),
            'total_days' => 3,
            'status' => 'pending',
        ]);
        $requestId = $request->id;

        // Simulate request deduction balance
        $balance = LeaveBalance::where('employee_id', $this->employeeId)->where('leave_type_id', $this->leaveTypeId)->first();
        $balance->update([
            'remaining' => 9,
            'pending' => 3,
        ]);

        $adminUser = User::where('email', 'admin@nexushr.local')->first();
        $adminUserId = $adminUser->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        // 2. Approve request
        $response = $this->postJson("/api/v1/leave-requests/{$requestId}/approve", [
            'approver_id' => $adminUserId,
            'comments' => 'Approved, have a good time.',
        ], $headers);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'approved');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('leave_requests', [
            'id' => $requestId,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('leave_balances', [
            'employee_id' => $this->employeeId,
            'leave_type_id' => $this->leaveTypeId,
            'remaining' => 9,
            'pending' => 0,
            'used' => 3,
        ]);

        $this->assertDatabaseHas('leave_approvals', [
            'leave_request_id' => $requestId,
            'approver_id' => $adminUserId,
            'status' => 'approved',
        ]);
        tenancy()->end();
    }

    public function test_can_reject_leave_request(): void
    {
        // 1. Submit a request first
        tenancy()->initialize($this->tenant);
        $request = LeaveRequest::factory()->create([
            'employee_id' => $this->employeeId,
            'leave_type_id' => $this->leaveTypeId,
            'start_date' => now()->addDays(2)->toDateString(),
            'end_date' => now()->addDays(4)->toDateString(),
            'total_days' => 3,
            'status' => 'pending',
        ]);
        $requestId = $request->id;

        // Simulate request deduction balance
        $balance = LeaveBalance::where('employee_id', $this->employeeId)->where('leave_type_id', $this->leaveTypeId)->first();
        $balance->update([
            'remaining' => 9,
            'pending' => 3,
        ]);

        $adminUser = User::where('email', 'admin@nexushr.local')->first();
        $adminUserId = $adminUser->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        // 2. Reject request
        $response = $this->postJson("/api/v1/leave-requests/{$requestId}/reject", [
            'approver_id' => $adminUserId,
            'comments' => 'Not approved due to high workload.',
        ], $headers);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'rejected');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('leave_requests', [
            'id' => $requestId,
            'status' => 'rejected',
        ]);

        // Balance should return to remaining
        $this->assertDatabaseHas('leave_balances', [
            'employee_id' => $this->employeeId,
            'leave_type_id' => $this->leaveTypeId,
            'remaining' => 12,
            'pending' => 0,
            'used' => 0,
        ]);

        $this->assertDatabaseHas('leave_approvals', [
            'leave_request_id' => $requestId,
            'approver_id' => $adminUserId,
            'status' => 'rejected',
        ]);
        tenancy()->end();
    }
}
