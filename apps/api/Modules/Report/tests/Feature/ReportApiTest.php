<?php

declare(strict_types=1);

namespace Modules\Report\Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Employee\Models\Employee;
use Modules\Attendance\Models\Shift;
use Modules\Attendance\Models\EmployeeShift;
use Modules\Attendance\Models\AttendanceLog;
use Modules\Leave\Models\LeaveType;
use Modules\Leave\Models\LeaveBalance;
use Modules\Leave\Models\LeaveRequest;
use Modules\Organization\Models\Department;

class ReportApiTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;
    private string $employeeId;
    private string $departmentId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        // Create tenant
        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Report Test Tenant',
            'slug' => 'reptest',
        ]);

        tenancy()->initialize($this->tenant);

        // Create initial structures
        $department = Department::factory()->create([
            'name' => 'Engineering',
            'code' => 'ENG',
        ]);
        $this->departmentId = $department->id;

        $employee = Employee::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'status' => 'permanent',
            'department_id' => $department->id,
            'join_date' => '2026-01-15',
        ]);
        $this->employeeId = $employee->id;

        // Setup Shift & Attendance logs for test
        $shift = Shift::factory()->create([
            'name' => 'Normal Shift',
            'code' => 'NORM-S',
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'late_tolerance' => 15,
        ]);

        EmployeeShift::factory()->create([
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'start_date' => '2026-01-01',
        ]);

        AttendanceLog::factory()->create([
            'employee_id' => $employee->id,
            'date' => '2026-06-01',
            'check_in' => '08:00:00',
            'check_out' => '17:00:00',
            'status' => 'present',
            'work_hours' => 9.00,
        ]);

        AttendanceLog::factory()->create([
            'employee_id' => $employee->id,
            'date' => '2026-06-02',
            'check_in' => '08:20:00',
            'check_out' => '17:00:00',
            'status' => 'late',
            'work_hours' => 8.67,
        ]);

        // Setup Leave Types, Balances & Requests for test
        $leaveType = LeaveType::factory()->create([
            'name' => 'Annual Leave',
            'code' => 'AL',
        ]);

        LeaveBalance::factory()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'year' => 2026,
            'entitled' => 12,
            'used' => 2,
            'remaining' => 10,
        ]);

        LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => '2026-06-10',
            'end_date' => '2026-06-11',
            'status' => 'approved',
            'reason' => 'Family event',
        ]);

        LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => '2026-06-25',
            'end_date' => '2026-06-25',
            'status' => 'pending',
            'reason' => 'Doctor appointment',
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

    public function test_can_query_employee_report(): void
    {
        $headers = $this->getAuthHeaders();

        // Query with status filter
        $response = $this->getJson('/api/v1/reports/employees?status=permanent', $headers);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'data' => [
                        '*' => ['id', 'first_name', 'last_name', 'employee_number', 'status']
                    ]
                ]
            ]);

        // Expect John Doe to be in the list
        $this->assertEquals('John', $response->json('data.data.0.first_name'));
    }

    public function test_can_query_attendance_report(): void
    {
        $headers = $this->getAuthHeaders();

        $response = $this->getJson('/api/v1/reports/attendance?start_date=2026-06-01&end_date=2026-06-02', $headers);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'employee_id',
                        'employee_number',
                        'employee_name',
                        'department',
                        'summary' => [
                            'present',
                            'late',
                            'early_leave',
                            'absent',
                            'total_days_logged',
                            'total_work_hours'
                        ]
                    ]
                ]
            ]);

        $this->assertEquals(1, $response->json('data.0.summary.present'));
        $this->assertEquals(1, $response->json('data.0.summary.late'));
        $this->assertEquals(17.67, $response->json('data.0.summary.total_work_hours'));
    }

    public function test_can_query_leave_report(): void
    {
        $headers = $this->getAuthHeaders();

        $response = $this->getJson('/api/v1/reports/leave?year=2026', $headers);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'employee_id',
                        'employee_number',
                        'employee_name',
                        'balances' => [
                            '*' => ['leave_type', 'code', 'allocated', 'used', 'remaining']
                        ],
                        'requests_summary' => [
                            'pending',
                            'approved',
                            'rejected',
                            'total'
                        ]
                    ]
                ]
            ]);

        $this->assertEquals(12, $response->json('data.0.balances.0.allocated'));
        $this->assertEquals(2, $response->json('data.0.balances.0.used'));
        $this->assertEquals(1, $response->json('data.0.requests_summary.approved'));
        $this->assertEquals(1, $response->json('data.0.requests_summary.pending'));
    }
}
