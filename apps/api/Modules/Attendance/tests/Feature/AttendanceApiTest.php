<?php

declare(strict_types=1);

namespace Modules\Attendance\Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Attendance\Models\Shift;
use Modules\Attendance\Models\EmployeeShift;
use Modules\Attendance\Models\AttendanceLog;
use Modules\Employee\Models\Employee;

class AttendanceApiTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;
    private string $employeeId;
    private string $shiftId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        // Create tenant
        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Attendance Test Tenant',
            'slug' => 'atttest',
        ]);

        tenancy()->initialize($this->tenant);

        // Create initial employee and shift
        $employee = Employee::factory()->create();
        $this->employeeId = $employee->id;

        $shift = Shift::factory()->create([
            'name' => 'Day Shift',
            'code' => 'DAY-SHIFT',
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'late_tolerance' => 15,
        ]);
        $this->shiftId = $shift->id;

        // Assign shift to employee
        EmployeeShift::factory()->create([
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'start_date' => now()->subDays(5)->toDateString(),
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

    public function test_can_list_shifts(): void
    {
        $headers = $this->getAuthHeaders();
        $response = $this->getJson('/api/v1/shifts', $headers);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => ['id', 'name', 'code', 'start_time', 'end_time']
                    ]
                ]
            ]);
    }

    public function test_can_create_shift(): void
    {
        $headers = $this->getAuthHeaders();

        $shiftData = [
            'name' => 'Night Shift',
            'code' => 'NIGHT-S',
            'start_time' => '22:00:00',
            'end_time' => '06:00:00',
            'late_tolerance' => 10,
        ];

        $response = $this->postJson('/api/v1/shifts', $shiftData, $headers);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Night Shift');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('shifts', [
            'code' => 'NIGHT-S',
            'name' => 'Night Shift'
        ]);
        tenancy()->end();
    }

    public function test_can_check_in_on_time(): void
    {
        $headers = $this->getAuthHeaders();

        $checkInData = [
            'employee_id' => $this->employeeId,
            'check_in_time' => now()->toDateString() . ' 08:10:00', // Within 15m tolerance
        ];

        $response = $this->postJson('/api/v1/attendances/check-in', $checkInData, $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'present');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('attendance_logs', [
            'employee_id' => $this->employeeId,
            'status' => 'present',
            'check_in' => '08:10:00',
        ]);
        tenancy()->end();
    }

    public function test_can_check_in_late(): void
    {
        $headers = $this->getAuthHeaders();

        $checkInData = [
            'employee_id' => $this->employeeId,
            'check_in_time' => now()->toDateString() . ' 08:20:00', // Exceeds 15m tolerance
        ];

        $response = $this->postJson('/api/v1/attendances/check-in', $checkInData, $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'late');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('attendance_logs', [
            'employee_id' => $this->employeeId,
            'status' => 'late',
            'check_in' => '08:20:00',
        ]);
        tenancy()->end();
    }

    public function test_can_check_out_and_calculate_hours(): void
    {
        // 1. Check in first
        tenancy()->initialize($this->tenant);
        AttendanceLog::factory()->create([
            'employee_id' => $this->employeeId,
            'date' => now()->toDateString(),
            'check_in' => '08:00:00',
            'check_out' => null,
            'status' => 'present',
        ]);
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        // 2. Check out
        $checkOutData = [
            'employee_id' => $this->employeeId,
            'check_out_time' => now()->toDateString() . ' 17:00:00', // Exactly end of shift
        ];

        $response = $this->postJson('/api/v1/attendances/check-out', $checkOutData, $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'present')
            ->assertJsonPath('data.work_hours', 9); // 08:00 to 17:00 is 9 hours

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('attendance_logs', [
            'employee_id' => $this->employeeId,
            'check_out' => '17:00:00',
            'work_hours' => 9.00,
        ]);
        tenancy()->end();
    }

    public function test_can_check_out_early(): void
    {
        // 1. Check in first
        tenancy()->initialize($this->tenant);
        AttendanceLog::factory()->create([
            'employee_id' => $this->employeeId,
            'date' => now()->toDateString(),
            'check_in' => '08:00:00',
            'check_out' => null,
            'status' => 'present',
        ]);
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        // 2. Check out early
        $checkOutData = [
            'employee_id' => $this->employeeId,
            'check_out_time' => now()->toDateString() . ' 16:30:00', // 30 mins early
        ];

        $response = $this->postJson('/api/v1/attendances/check-out', $checkOutData, $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'early_leave');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('attendance_logs', [
            'employee_id' => $this->employeeId,
            'status' => 'early_leave',
            'work_hours' => 8.50, // 08:00 to 16:30 is 8.5 hours
        ]);
        tenancy()->end();
    }
}
