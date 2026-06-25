<?php

declare(strict_types=1);

namespace Modules\Audit\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use App\Models\User;
use Modules\Employee\Models\Employee;
use Modules\Audit\Models\AuditLog;
use Modules\Audit\Models\LoginHistory;
use Modules\Audit\Services\ComplianceService;
use Modules\Certification\Models\Certification;
use Modules\Certification\Models\EmployeeCertification;

class AuditTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;
    private ComplianceService $complianceService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Audit Test Tenant',
            'slug' => 'audittest',
        ]);

        tenancy()->initialize($this->tenant);
        $this->complianceService = app(ComplianceService::class);
    }

    public function test_login_history_creation(): void
    {
        $user = User::factory()->create();

        $history = LoginHistory::factory()->create([
            'user_id' => $user->id,
            'status' => 'success',
            'browser' => 'Chrome',
            'os' => 'Windows',
        ]);

        $this->assertNotNull($history->id);
        $this->assertEquals('success', $history->status);
        $this->assertEquals('Chrome', $history->browser);
        $this->assertEquals('Windows', $history->os);
    }

    public function test_automatic_audit_log_generation_on_create(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'api');

        // Saat membuat employee, audit log harus terbentuk secara otomatis via global event listener
        $employee = Employee::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        // Verifikasi log audit terbentuk di database
        $log = AuditLog::where('auditable_type', Employee::class)
            ->where('auditable_id', $employee->id)
            ->where('action', 'created')
            ->first();

        $this->assertNotNull($log);
        $this->assertEquals($user->id, $log->user_id);
        $this->assertEquals('created', $log->action);
        $this->assertNotNull($log->new_values);
        $this->assertEquals('John', $log->new_values['first_name'] ?? null);
    }

    public function test_automatic_audit_log_generation_on_update(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'api');

        $employee = Employee::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '12345',
        ]);

        // Update employee
        $employee->update([
            'first_name' => 'Johnny',
            'phone' => '54321',
        ]);

        $log = AuditLog::where('auditable_type', Employee::class)
            ->where('auditable_id', $employee->id)
            ->where('action', 'updated')
            ->first();

        $this->assertNotNull($log);
        $this->assertEquals('updated', $log->action);
        
        // Cek old & new values
        $this->assertEquals('John', $log->old_values['first_name'] ?? null);
        $this->assertEquals('Johnny', $log->new_values['first_name'] ?? null);
        $this->assertEquals('12345', $log->old_values['phone'] ?? null);
        $this->assertEquals('54321', $log->new_values['phone'] ?? null);
    }

    public function test_compliance_expiring_contracts(): void
    {
        // Karyawan permanen (tidak boleh masuk expiring contract)
        Employee::factory()->create([
            'employment_type' => 'permanent',
            'end_date' => now()->addDays(5)->toDateString(),
        ]);

        // Karyawan kontrak dengan masa habis 10 hari lagi
        $expiringEmployee = Employee::factory()->create([
            'employment_type' => 'contract',
            'end_date' => now()->addDays(10)->toDateString(),
        ]);

        // Karyawan kontrak dengan masa habis 60 hari lagi
        Employee::factory()->create([
            'employment_type' => 'contract',
            'end_date' => now()->addDays(60)->toDateString(),
        ]);

        // Query kontrak yang habis dalam 30 hari
        $contracts = $this->complianceService->getExpiringContracts(30);

        $this->assertCount(1, $contracts);
        $this->assertEquals($expiringEmployee->id, $contracts->first()->id);
    }

    public function test_compliance_expiring_certifications(): void
    {
        $employee = Employee::factory()->create();
        $certification = Certification::factory()->create([
            'name' => 'AWS Solutions Architect',
        ]);

        // Sertifikat expired 10 hari lagi
        $expiringCert = EmployeeCertification::factory()->create([
            'employee_id' => $employee->id,
            'certification_id' => $certification->id,
            'expired_date' => now()->addDays(10)->toDateString(),
        ]);

        // Sertifikat expired 90 hari lagi
        EmployeeCertification::factory()->create([
            'employee_id' => $employee->id,
            'certification_id' => $certification->id,
            'expired_date' => now()->addDays(90)->toDateString(),
        ]);

        // Query sertifikat yang habis dalam 30 hari
        $expiring = $this->complianceService->getExpiringCertifications(30);

        $this->assertCount(1, $expiring);
        $this->assertEquals($expiringCert->id, $expiring->first()->id);
        $this->assertEquals('AWS Solutions Architect', $expiring->first()->certification_name);
    }
}
