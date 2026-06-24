<?php

namespace Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class TenantSetupApiTest extends TestCase
{
    use DatabaseMigrations;

    private string $centralToken = 'nexus_central_secret';

    public function test_tenant_api_requires_valid_central_token(): void
    {
        $response = $this->getJson('/api/v1/tenants');
        $response->assertStatus(401)
            ->assertJsonPath('success', false);

        $response = $this->getJson('/api/v1/tenants', [
            'X-Central-Token' => 'invalid_token'
        ]);
        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_can_manage_tenants_via_api(): void
    {
        $headers = ['X-Central-Token' => $this->centralToken];

        // 1. Create a tenant via API
        $response = $this->postJson('/api/v1/tenants', [
            'name' => 'Acme Corporation',
            'slug' => 'acme-corp',
        ], $headers);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Acme Corporation')
            ->assertJsonPath('data.slug', 'acme-corp')
            ->assertJsonPath('data.domain', 'acme-corp.local');

        $tenantId = $response->json('data.id');

        // Verify databases records
        $this->assertDatabaseHas('tenants', ['slug' => 'acme-corp']);
        $this->assertDatabaseHas('domains', ['domain' => 'acme-corp.local']);

        // 2. List tenants via API
        $listResponse = $this->getJson('/api/v1/tenants', $headers);
        $listResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => [['id', 'name', 'slug', 'domain', 'created_at']]]);

        // 3. Update tenant via API
        $updateResponse = $this->putJson("/api/v1/tenants/{$tenantId}", [
            'name' => 'Acme Corporation Updated',
            'slug' => 'acme-corp-updated',
        ], $headers);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Acme Corporation Updated')
            ->assertJsonPath('data.slug', 'acme-corp-updated')
            ->assertJsonPath('data.domain', 'acme-corp-updated.local');

        $this->assertDatabaseHas('tenants', [
            'id' => $tenantId,
            'name' => 'Acme Corporation Updated',
            'slug' => 'acme-corp-updated',
        ]);
        $this->assertDatabaseHas('domains', [
            'domain' => 'acme-corp-updated.local',
            'tenant_id' => $tenantId,
        ]);

        // 4. Delete tenant via API
        $deleteResponse = $this->deleteJson("/api/v1/tenants/{$tenantId}", [], $headers);
        $deleteResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('tenants', ['id' => $tenantId]);
    }
}
