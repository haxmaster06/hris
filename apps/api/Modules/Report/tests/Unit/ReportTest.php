<?php

declare(strict_types=1);

namespace Modules\Report\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Employee\Models\Employee;
use Modules\Report\Services\ReportService;

class ReportTest extends TestCase
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
            'name' => 'Report Test Tenant',
            'slug' => 'reporttest',
        ]);

        tenancy()->initialize($this->tenant);
    }

    public function test_turnover_report_metrics(): void
    {
        $year = (int) date('Y');
        
        // Create hired employees in current year/month
        Employee::factory()->count(2)->create([
            'join_date' => date('Y-m-d'),
        ]);

        $service = new ReportService();
        $turnover = $service->turnoverReport($year);

        $currentMonthIndex = (int) date('n') - 1;
        $this->assertEquals(2, $turnover[$currentMonthIndex]['hired']);
        $this->assertEquals(0, $turnover[$currentMonthIndex]['terminated']);
    }

    public function test_headcount_report_metrics(): void
    {
        Employee::factory()->create([
            'join_date' => date('Y-m-d'),
            'end_date' => null,
        ]);

        $service = new ReportService();
        $headcount = $service->headcountReport();

        $currentMonthIndex = (int) date('n') - 1;
        $this->assertEquals(1, $headcount[$currentMonthIndex]['headcount']);
    }
}
