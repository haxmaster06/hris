<?php

declare(strict_types=1);

namespace Modules\Compensation\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Employee\Models\Employee;
use Modules\Compensation\Models\Benefit;
use Modules\Compensation\Models\EmployeeBenefit;
use Modules\Compensation\Models\Claim;
use Modules\Compensation\Models\BonusScheme;

class CompensationTest extends TestCase
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
            'name' => 'Compensation Test Tenant',
            'slug' => 'comptest',
        ]);

        tenancy()->initialize($this->tenant);
    }

    public function test_benefit_creation_and_enrollment(): void
    {
        $employee = Employee::factory()->create();
        $benefit = Benefit::factory()->create([
            'name' => 'Kesehatan Gold',
            'type' => 'health_insurance',
            'company_contribution' => 500000.00,
        ]);

        $eb = EmployeeBenefit::factory()->create([
            'employee_id' => $employee->id,
            'benefit_id' => $benefit->id,
            'start_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        $this->assertNotNull($eb->id);
        $this->assertInstanceOf(Employee::class, $eb->employee);
        $this->assertInstanceOf(Benefit::class, $eb->benefit);
        $this->assertEquals('Kesehatan Gold', $eb->benefit->name);
        $this->assertEquals('active', $eb->status);
    }

    public function test_claim_approval_flow(): void
    {
        $employee = Employee::factory()->create();
        
        $claim = Claim::factory()->create([
            'employee_id' => $employee->id,
            'amount' => 150000.00,
            'status' => 'submitted',
        ]);

        $this->assertEquals('submitted', $claim->status);
        $this->assertNull($claim->approved_amount);

        // Simulate Controller Approve
        $claim->update([
            'status' => 'approved',
            'approved_amount' => 120000.00,
            'approved_by' => (string) Str::uuid(),
            'approved_at' => now(),
        ]);

        $updatedClaim = $claim->fresh();
        $this->assertEquals('approved', $updatedClaim->status);
        $this->assertEquals(120000.00, $updatedClaim->approved_amount);
    }

    public function test_claim_rejection_flow(): void
    {
        $employee = Employee::factory()->create();
        
        $claim = Claim::factory()->create([
            'employee_id' => $employee->id,
            'amount' => 150000.00,
            'status' => 'submitted',
        ]);

        // Simulate Controller Reject
        $claim->update([
            'status' => 'rejected',
            'rejection_reason' => 'Receipt is illegible',
            'approved_by' => (string) Str::uuid(),
            'approved_at' => now(),
        ]);

        $updatedClaim = $claim->fresh();
        $this->assertEquals('rejected', $updatedClaim->status);
        $this->assertEquals('Receipt is illegible', $updatedClaim->rejection_reason);
    }

    public function test_bonus_scheme_creation(): void
    {
        $scheme = BonusScheme::factory()->create([
            'name' => 'Bonus Kuartal 1',
            'type' => 'performance',
            'calculation_type' => 'percentage',
            'value' => 10.00,
        ]);

        $this->assertNotNull($scheme->id);
        $this->assertEquals('Bonus Kuartal 1', $scheme->name);
        $this->assertEquals('percentage', $scheme->calculation_type);
        $this->assertEquals(10.00, $scheme->value);
    }
}
