<?php

declare(strict_types=1);

namespace Modules\Organization\Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use App\Models\Tenant;
use Modules\Organization\Models\Company;
use Modules\Organization\Models\CostCenter;
use Modules\Organization\Services\CostCenterService;

class CostCenterTest extends TestCase
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
            'name' => 'Cost Center Test Tenant',
            'slug' => 'costcenterstest',
        ]);
        
        tenancy()->initialize($this->tenant);
    }

    public function test_cost_center_creation_and_relations(): void
    {
        $company = Company::factory()->create();

        $costCenter = CostCenter::factory()->create([
            'company_id' => $company->id,
            'code' => 'CC-HQ-101',
            'name' => 'HQ General Operations',
            'is_active' => true,
        ]);

        $this->assertNotNull($costCenter->id);
        $this->assertInstanceOf(Company::class, $costCenter->company);
        $this->assertEquals($company->id, $costCenter->company->id);
        $this->assertTrue($costCenter->is_active);
    }

    public function test_cost_center_search_and_pagination_via_service(): void
    {
        $company = Company::factory()->create();
        $service = app(CostCenterService::class);

        $cc1 = $service->create([
            'code' => 'CC-SALES',
            'name' => 'Sales and Marketing Division',
            'company_id' => $company->id,
            'is_active' => true,
        ]);

        $cc2 = $service->create([
            'code' => 'CC-HRD',
            'name' => 'Human Resources Division',
            'company_id' => $company->id,
            'is_active' => false,
        ]);

        // Search by keyword
        $resultsSearch = $service->list(['search' => 'Sales']);
        $this->assertCount(1, $resultsSearch);
        $this->assertEquals('CC-SALES', $resultsSearch->first()->code);

        // Filter by status
        $resultsActive = $service->list(['is_active' => 'true']);
        $this->assertCount(1, $resultsActive);
        $this->assertEquals('CC-SALES', $resultsActive->first()->code);

        $resultsInactive = $service->list(['is_active' => 'false']);
        $this->assertCount(1, $resultsInactive);
        $this->assertEquals('CC-HRD', $resultsInactive->first()->code);
    }
}
