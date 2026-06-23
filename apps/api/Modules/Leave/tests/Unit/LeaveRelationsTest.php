<?php

declare(strict_types=1);

namespace Modules\Leave\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Leave\Models\LeaveType;
use Modules\Leave\Models\LeaveBalance;
use Modules\Leave\Models\LeaveRequest;
use Modules\Leave\Models\LeaveApproval;
use Modules\Employee\Models\Employee;
use App\Models\User;

class LeaveRelationsTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        // Create tenant
        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Leave Unit Tenant',
            'slug' => 'leaveunit',
        ]);

        tenancy()->initialize($this->tenant);
    }

    protected function tearDown(): void
    {
        tenancy()->end();
        parent::tearDown();
    }

    public function test_leave_models_and_relationships(): void
    {
        // 1. Test LeaveType
        $leaveType = LeaveType::factory()->create([
            'name' => 'Annual Cuti',
            'code' => 'CT-ANNUAL',
            'default_days' => 12,
            'is_paid' => true,
        ]);

        $this->assertNotNull($leaveType->id);
        $this->assertEquals('Annual Cuti', $leaveType->name);

        // 2. Test LeaveBalance
        $employee = Employee::factory()->create();
        $balance = LeaveBalance::factory()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'year' => 2026,
            'entitled' => 12,
            'used' => 2,
            'pending' => 1,
            'remaining' => 9,
        ]);

        $this->assertNotNull($balance->id);
        $this->assertInstanceOf(Employee::class, $balance->employee);
        $this->assertInstanceOf(LeaveType::class, $balance->leaveType);
        $this->assertEquals($employee->id, $balance->employee->id);
        $this->assertEquals($leaveType->id, $balance->leaveType->id);

        // 3. Test LeaveRequest
        $request = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => '2026-06-25',
            'end_date' => '2026-06-27',
            'total_days' => 3,
            'status' => 'pending',
        ]);

        $this->assertNotNull($request->id);
        $this->assertInstanceOf(Employee::class, $request->employee);
        $this->assertInstanceOf(LeaveType::class, $request->leaveType);

        // 4. Test LeaveApproval
        $user = User::factory()->create();
        $approval = LeaveApproval::factory()->create([
            'leave_request_id' => $request->id,
            'approver_id' => $user->id,
            'status' => 'approved',
            'comments' => 'Have fun!',
        ]);

        $this->assertNotNull($approval->id);
        $this->assertInstanceOf(LeaveRequest::class, $approval->leaveRequest);
        $this->assertInstanceOf(User::class, $approval->approver);
        $this->assertEquals($request->id, $approval->leaveRequest->id);
        $this->assertEquals($user->id, $approval->approver->id);
    }
}
