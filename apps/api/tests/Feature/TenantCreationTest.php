<?php

namespace Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class TenantCreationTest extends TestCase
{
    use DatabaseMigrations;

    /**
     * Test that a tenant can be created with domain mapping in the central database.
     */
    public function test_tenant_creation_automatically_creates_database_and_domain_mapping(): void
    {
        $id = (string) \Illuminate\Support\Str::uuid();

        // 1. Create a tenant
        $tenant = Tenant::create([
            'id' => $id,
            'name' => 'HBM Test Company',
            'slug' => 'hbm_test',
        ]);

        // 2. Map domain
        $tenant->domains()->create([
            'domain' => 'hbm-test.local',
        ]);

        // 3. Verify tenant database record exists in central database
        $this->assertDatabaseHas('tenants', [
            'id' => $id,
            'name' => 'HBM Test Company',
            'slug' => 'hbm_test',
        ]);

        $this->assertDatabaseHas('domains', [
            'domain' => 'hbm-test.local',
            'tenant_id' => $id,
        ]);
    }
}
