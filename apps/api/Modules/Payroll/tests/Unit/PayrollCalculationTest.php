<?php

declare(strict_types=1);

namespace Modules\Payroll\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Employee\Models\Employee;
use Modules\Payroll\Models\PayrollPeriod;
use Modules\Payroll\Models\PayrollRun;
use Modules\Payroll\Models\PayrollRunDetail;
use Modules\Payroll\Models\PayrollComponent;
use Modules\Payroll\Models\EmployeeSalary;
use Modules\Payroll\Models\EmployeeAllowance;
use Modules\Payroll\Models\EmployeeLoan;
use Modules\Payroll\Database\Seeders\PayrollDatabaseSeeder;
use Modules\Payroll\Services\PayrollCalculationService;

class PayrollCalculationTest extends TestCase
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
            'name' => 'Payroll Test Tenant',
            'slug' => 'payrolltest',
        ]);

        tenancy()->initialize($this->tenant);

        // Seed default components
        (new PayrollDatabaseSeeder())->run();
    }

    public function test_calculate_for_employee_gross(): void
    {
        $employee = Employee::factory()->create();

        // Setup salary config (Gross, basic 10,000,000, status TK/0)
        EmployeeSalary::factory()->create([
            'employee_id' => $employee->id,
            'basic_salary' => 10000000.00,
            'tax_method' => 'gross',
            'tax_status' => 'TK/0',
            'bpjs_class' => '1',
            'effective_date' => now()->subMonths(1)->toDateString(),
        ]);

        // Add allowance
        $allowanceComp = PayrollComponent::where('code', 'TJAB')->first();
        EmployeeAllowance::factory()->create([
            'employee_id' => $employee->id,
            'payroll_component_id' => $allowanceComp->id,
            'amount' => 2000000.00, // total gross = 12,000,000.
            'effective_date' => now()->subMonths(1)->toDateString(),
            'is_active' => true,
        ]);

        // Create period
        $period = PayrollPeriod::factory()->create([
            'month' => 6,
            'year' => 2026,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-25',
        ]);

        $service = app(PayrollCalculationService::class);
        $run = $service->calculateForEmployee($employee, $period);

        $this->assertInstanceOf(PayrollRun::class, $run);
        $this->assertEquals(10000000.00, $run->basic_salary);
        $this->assertEquals(12000000.00, $run->total_earnings); // basic + TJAB
        
        // PPh 21 rate untuk 12,000,000 TK/0 (Category A) adalah 2.25% -> 270,000
        $this->assertEquals(270000.00, $run->tax_amount);

        // Verify that details were created
        $details = $run->payrollRunDetails;
        $this->assertGreaterThan(0, $details->count());
        $this->assertNotNull($details->where('component_name', 'Gaji Pokok')->first());
        $this->assertNotNull($details->where('component_name', 'Tunjangan Jabatan')->first());
        $this->assertNotNull($details->where('component_name', 'Potongan PPh 21')->first());
    }

    public function test_calculate_with_loan_deduction(): void
    {
        $employee = Employee::factory()->create();

        // Setup salary config
        EmployeeSalary::factory()->create([
            'employee_id' => $employee->id,
            'basic_salary' => 8000000.00,
            'tax_method' => 'nett',
            'tax_status' => 'TK/0',
            'effective_date' => now()->subMonths(1)->toDateString(),
        ]);

        // Add employee loan (Total 5,000,000, installment 1,000,000)
        $loan = EmployeeLoan::factory()->create([
            'employee_id' => $employee->id,
            'principal_amount' => 5000000.00,
            'remaining_amount' => 5000000.00,
            'installment_amount' => 1000000.00,
            'total_installments' => 5,
            'paid_installments' => 0,
            'status' => 'active',
        ]);

        // Create period
        $period = PayrollPeriod::factory()->create([
            'month' => 6,
            'year' => 2026,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-25',
        ]);

        $service = app(PayrollCalculationService::class);
        $run = $service->calculateForEmployee($employee, $period);

        // Loan deduction must be present in details
        $loanDetail = PayrollRunDetail::where('payroll_run_id', $run->id)
            ->where('type', 'deduction')
            ->where('component_name', 'like', '%Cicilan Pinjaman%')
            ->first();

        $this->assertNotNull($loanDetail);
        $this->assertEquals(1000000.00, $loanDetail->amount);

        // Lock period and check if paid_installments increases
        $service->lockPeriod($period);

        $loan = $loan->fresh();
        $this->assertEquals(1, $loan->paid_installments);
        $this->assertEquals(4000000.00, $loan->remaining_amount);
    }
}
