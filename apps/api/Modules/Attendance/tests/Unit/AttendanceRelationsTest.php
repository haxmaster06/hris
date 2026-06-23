<?php

declare(strict_types=1);

namespace Modules\Attendance\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Attendance\Models\Shift;
use Modules\Attendance\Models\EmployeeShift;
use Modules\Attendance\Models\AttendanceLog;
use Modules\Employee\Models\Employee;

class AttendanceRelationsTest extends TestCase
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
            'name' => 'Attendance Unit Tenant',
            'slug' => 'attunit',
        ]);

        tenancy()->initialize($this->tenant);
    }

    protected function tearDown(): void
    {
        tenancy()->end();
        parent::tearDown();
    }

    public function test_attendance_models_and_relationships(): void
    {
        // 1. Test Shift
        $shift = Shift::factory()->create([
            'name' => 'Morning Shift',
            'code' => 'SH-MORN',
            'start_time' => '07:00:00',
            'end_time' => '16:00:00',
            'late_tolerance' => 10,
        ]);

        $this->assertNotNull($shift->id);
        $this->assertEquals('Morning Shift', $shift->name);

        // 2. Test EmployeeShift mapping
        $employee = Employee::factory()->create();
        $employeeShift = EmployeeShift::factory()->create([
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'start_date' => '2026-06-01',
            'end_date' => '2026-12-31',
        ]);

        $this->assertNotNull($employeeShift->id);
        $this->assertInstanceOf(Employee::class, $employeeShift->employee);
        $this->assertInstanceOf(Shift::class, $employeeShift->shift);
        $this->assertEquals($employee->id, $employeeShift->employee->id);
        $this->assertEquals($shift->id, $employeeShift->shift->id);

        // 3. Test AttendanceLog
        $log = AttendanceLog::factory()->create([
            'employee_id' => $employee->id,
            'date' => '2026-06-23',
            'check_in' => '07:05:00',
            'check_out' => '16:00:00',
            'status' => 'present',
            'work_hours' => 8.92,
        ]);

        $this->assertNotNull($log->id);
        $this->assertInstanceOf(Employee::class, $log->employee);
        $this->assertEquals($employee->id, $log->employee->id);
    }
}
