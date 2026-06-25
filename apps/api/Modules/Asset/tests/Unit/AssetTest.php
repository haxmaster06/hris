<?php

declare(strict_types=1);

namespace Modules\Asset\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Employee\Models\Employee;
use Modules\Asset\Models\Asset;
use Modules\Asset\Models\AssetAssignment;

class AssetTest extends TestCase
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
            'name' => 'Asset Test Tenant',
            'slug' => 'assettest',
        ]);

        tenancy()->initialize($this->tenant);
    }

    /**
     * Test asset creation and field definitions.
     */
    public function test_asset_creation_and_fields(): void
    {
        $asset = Asset::factory()->create([
            'asset_number' => 'AST-9999',
            'name' => 'Developer Workstation',
            'category' => 'laptop',
            'status' => 'available',
        ]);

        $this->assertNotNull($asset);
        $this->assertEquals('AST-9999', $asset->asset_number);
        $this->assertEquals('available', $asset->status);
    }

    /**
     * Test full lifecycle of asset assignment and return.
     */
    public function test_asset_assignment_and_return_lifecycle(): void
    {
        $asset = Asset::factory()->create([
            'status' => 'available',
        ]);
        $employee = Employee::factory()->create();
        $manager = Employee::factory()->create();

        // Assign Asset
        $assignment = AssetAssignment::factory()->create([
            'asset_id' => $asset->id,
            'employee_id' => $employee->id,
            'condition_on_assign' => 'new',
            'assigned_by' => $manager->id,
            'status' => 'active',
        ]);

        $asset->update(['status' => 'assigned']);

        $this->assertEquals('assigned', $asset->fresh()->status);
        $this->assertEquals('active', $assignment->status);

        // Return Asset
        $assignment->update([
            'returned_date' => now()->toDateString(),
            'condition_on_return' => 'good',
            'status' => 'returned',
            'received_by' => $manager->id,
        ]);

        $asset->update([
            'status' => 'available',
            'condition' => 'good',
        ]);

        $this->assertEquals('returned', $assignment->fresh()->status);
        $this->assertEquals('available', $asset->fresh()->status);
        $this->assertEquals('good', $asset->fresh()->condition);
    }
}
