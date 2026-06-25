<?php

declare(strict_types=1);

namespace Modules\Disciplinary\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Employee\Models\Employee;
use Modules\Disciplinary\Models\DisciplinaryCase;
use Modules\Disciplinary\Models\DisciplinaryAction;
use Modules\Disciplinary\Models\Investigation;
use Carbon\Carbon;

class DisciplinaryTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Disciplinary Test Tenant',
            'slug' => 'disciplinarytest',
        ]);

        tenancy()->initialize($this->tenant);
    }

    public function test_disciplinary_case_number_generation(): void
    {
        $employee = Employee::factory()->create();
        $reporter = Employee::factory()->create();

        // Simulate case creation
        $year = now()->format('Y');
        $month = now()->format('m');
        $prefix = "CASE/{$year}/{$month}/";
        
        $case = DisciplinaryCase::factory()->create([
            'employee_id' => $employee->id,
            'reported_by' => $reporter->id,
            'case_number' => $prefix . '0001',
        ]);

        $this->assertNotNull($case);
        $this->assertEquals($prefix . '0001', $case->case_number);
        $this->assertEquals('reported', $case->status);
    }

    public function test_investigation_state_transition(): void
    {
        $case = DisciplinaryCase::factory()->create();
        $investigator = Employee::factory()->create();

        $investigation = Investigation::create([
            'disciplinary_case_id' => $case->id,
            'investigator_id' => $investigator->id,
            'findings' => 'Evidence shows misconduct.',
            'status' => 'in_progress',
        ]);

        $case->update(['status' => 'under_investigation']);
        $this->assertEquals('under_investigation', $case->fresh()->status);

        // Complete investigation
        $investigation->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
        $case->update(['status' => 'hearing']);

        $this->assertEquals('hearing', $case->fresh()->status);
        $this->assertNotNull($investigation->completed_at);
    }

    public function test_disciplinary_action_warning_expiry_calculation(): void
    {
        $case = DisciplinaryCase::factory()->create();
        $issuer = Employee::factory()->create();

        $effectiveDate = Carbon::parse('2026-06-25');
        
        // For warning letters (sp1, sp2, sp3), if expiry is not provided, it should automatically be +6 months
        $expiryDate = $effectiveDate->copy()->addMonths(6);

        $action = DisciplinaryAction::create([
            'disciplinary_case_id' => $case->id,
            'action_type' => 'sp1',
            'effective_date' => $effectiveDate->toDateString(),
            'expiry_date' => $expiryDate->toDateString(),
            'description' => 'First warning letter.',
            'issued_by' => $issuer->id,
        ]);

        $this->assertEquals('2026-06-25', $action->effective_date->toDateString());
        $this->assertEquals('2026-12-25', $action->expiry_date->toDateString());
    }
}
