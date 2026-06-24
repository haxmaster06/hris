<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();
        $slug = 'usr' . strtolower(Str::random(8));

        // Create tenant
        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'User Test Tenant',
            'slug' => $slug,
        ]);

        $this->tenant->domains()->create([
            'domain' => $slug . '.local',
        ]);
    }

    private function getAuthHeaders(): array
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@nexushr.local',
            'password' => 'admin123',
        ], [
            'X-Tenant-ID' => $this->tenantId,
        ]);

        $token = $response->json('data.access_token');

        return [
            'X-Tenant-ID' => $this->tenantId,
            'Authorization' => 'Bearer ' . $token,
        ];
    }

    public function test_can_manage_users_via_api(): void
    {
        $headers = $this->getAuthHeaders();

        // 1. Create User
        $response = $this->postJson('/api/v1/users', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'secret123',
            'roles' => ['HR Manager'],
        ], $headers);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'John Doe')
            ->assertJsonPath('data.email', 'john@example.com')
            ->assertJsonPath('data.roles.0', 'HR Manager');

        $userId = $response->json('data.id');

        // 2. List Users
        $this->getJson('/api/v1/users', $headers)
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['data' => [['id', 'name', 'email', 'roles', 'created_at']]]]);

        // 3. Show User
        $this->getJson("/api/v1/users/{$userId}", $headers)
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'John Doe');

        // 4. Update User
        $this->putJson("/api/v1/users/{$userId}", [
            'name' => 'John Doe Updated',
            'email' => 'john_new@example.com',
            'roles' => ['Employee'],
        ], $headers)
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'John Doe Updated')
            ->assertJsonPath('data.roles.0', 'Employee');

        // 5. List Roles
        $this->getJson('/api/v1/roles', $headers)
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => [['id', 'name']]]);

        // 6. Delete User
        $this->deleteJson("/api/v1/users/{$userId}", [], $headers)
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_can_manage_tenant_settings_via_api(): void
    {
        $headers = $this->getAuthHeaders();

        // 1. Get Tenant Settings
        $response = $this->getJson('/api/v1/tenant/settings', $headers);
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $this->tenantId)
            ->assertJsonPath('data.name', 'User Test Tenant');

        // 2. Update Tenant Settings
        $updateResponse = $this->putJson('/api/v1/tenant/settings', [
            'name' => 'User Test Tenant Updated',
        ], $headers);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'User Test Tenant Updated');

        // Verify database value
        $this->assertEquals('User Test Tenant Updated', $this->tenant->fresh()->name);
    }

    public function test_super_admin_restrictions_require_pin_and_cannot_be_deleted(): void
    {
        $headers = $this->getAuthHeaders();

        // 1. Create a User with Super Admin role
        $createResponse = $this->postJson('/api/v1/users', [
            'name' => 'Test Super Admin',
            'email' => 'tsuperadmin@example.com',
            'password' => 'secret123',
            'roles' => ['Super Admin'],
        ], $headers);

        $createResponse->assertStatus(201);
        $userId = $createResponse->json('data.id');

        // 2. Try to update this Super Admin user without a PIN -> Should fail 422
        $this->putJson("/api/v1/users/{$userId}", [
            'name' => 'Updated Name',
            'email' => 'tsuperadmin@example.com',
            'roles' => ['Super Admin'],
        ], $headers)
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        // 3. Try to update this Super Admin user with an invalid PIN -> Should fail 422
        $this->putJson("/api/v1/users/{$userId}", [
            'name' => 'Updated Name',
            'email' => 'tsuperadmin@example.com',
            'roles' => ['Super Admin'],
            'super_admin_pin' => '000000',
        ], $headers)
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        // 4. Update this Super Admin user with the valid PIN -> Should succeed
        $this->putJson("/api/v1/users/{$userId}", [
            'name' => 'Updated Name',
            'email' => 'tsuperadmin@example.com',
            'roles' => ['Super Admin'],
            'super_admin_pin' => '444329',
        ], $headers)
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Updated Name');

        // 5. Try to delete the Super Admin user -> Should fail 403
        $this->deleteJson("/api/v1/users/{$userId}", [], $headers)
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_non_super_admin_cannot_create_or_modify_super_admin(): void
    {
        $adminHeaders = $this->getAuthHeaders();

        // 1. Create a regular HR Manager user
        $hrResponse = $this->postJson('/api/v1/users', [
            'name' => 'HR Manager User',
            'email' => 'hrmanager@example.com',
            'password' => 'secret123',
            'roles' => ['HR Manager'],
        ], $adminHeaders);
        $hrResponse->assertStatus(201);

        // Login as this HR Manager to get auth headers
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'hrmanager@example.com',
            'password' => 'secret123',
        ], [
            'X-Tenant-ID' => $this->tenantId,
        ]);
        $loginResponse->assertStatus(200);
        $hrToken = $loginResponse->json('data.access_token');
        
        $hrHeaders = [
            'X-Tenant-ID' => $this->tenantId,
            'Authorization' => 'Bearer ' . $hrToken,
        ];

        // 2. HR Manager tries to create a Super Admin -> Should fail with 403
        $this->postJson('/api/v1/users', [
            'name' => 'Failed Super Admin',
            'email' => 'failedsa@example.com',
            'password' => 'secret123',
            'roles' => ['Super Admin'],
        ], $hrHeaders)
            ->assertStatus(403);

        // 3. Create a Super Admin using Admin headers
        $saResponse = $this->postJson('/api/v1/users', [
            'name' => 'Actual Super Admin',
            'email' => 'actualsa@example.com',
            'password' => 'secret123',
            'roles' => ['Super Admin'],
        ], $adminHeaders);
        $saResponse->assertStatus(201);
        $saUserId = $saResponse->json('data.id');

        // 4. HR Manager tries to update the Super Admin -> Should fail with 403
        $this->putJson("/api/v1/users/{$saUserId}", [
            'name' => 'Illegal Update',
            'email' => 'actualsa@example.com',
            'roles' => ['Super Admin'],
            'super_admin_pin' => '444329', // PIN correct but user is not Super Admin
        ], $hrHeaders)
            ->assertStatus(403);

        // 5. HR Manager tries to delete the Super Admin -> Should fail with 403
        $this->deleteJson("/api/v1/users/{$saUserId}", [], $hrHeaders)
            ->assertStatus(403);
    }
}
