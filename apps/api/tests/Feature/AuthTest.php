<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        // Create a tenant
        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'HBM',
            'slug' => 'hbm',
        ]);

        $this->tenant->domains()->create([
            'domain' => 'hbm.local',
        ]);
    }

    /**
     * Test login with valid credentials.
     */
    public function test_user_can_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@nexushr.local',
            'password' => 'admin123',
        ], [
            'X-Tenant-ID' => $this->tenantId,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'access_token',
                    'token_type',
                    'expires_in',
                ],
            ]);
    }

    /**
     * Test login with invalid credentials.
     */
    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@nexushr.local',
            'password' => 'wrongpassword',
        ], [
            'X-Tenant-ID' => $this->tenantId,
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid email or password',
            ]);
    }

    /**
     * Test fetching user profile.
     */
    public function test_authenticated_user_can_fetch_profile(): void
    {
        // 1. Login to get token
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@nexushr.local',
            'password' => 'admin123',
        ], [
            'X-Tenant-ID' => $this->tenantId,
        ]);

        $token = $loginResponse->json('data.access_token');

        // 2. Fetch profile with token
        $response = $this->getJson('/api/v1/auth/me', [
            'X-Tenant-ID' => $this->tenantId,
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'name',
                    'email',
                    'roles',
                    'permissions',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJsonPath('data.email', 'admin@nexushr.local');
    }

    /**
     * Test logout.
     */
    public function test_authenticated_user_can_logout(): void
    {
        // 1. Login to get token
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@nexushr.local',
            'password' => 'admin123',
        ], [
            'X-Tenant-ID' => $this->tenantId,
        ]);

        $token = $loginResponse->json('data.access_token');

        // 2. Logout
        $response = $this->postJson('/api/v1/auth/logout', [], [
            'X-Tenant-ID' => $this->tenantId,
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Successfully logged out',
            ]);

        // 3. Trying to access me again should fail
        $meResponse = $this->getJson('/api/v1/auth/me', [
            'X-Tenant-ID' => $this->tenantId,
            'Authorization' => 'Bearer ' . $token,
        ]);

        $meResponse->assertStatus(401);
    }

    /**
     * Test token refresh.
     */
    public function test_authenticated_user_can_refresh_token(): void
    {
        // 1. Login to get token
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@nexushr.local',
            'password' => 'admin123',
        ], [
            'X-Tenant-ID' => $this->tenantId,
        ]);

        $token = $loginResponse->json('data.access_token');

        // 2. Refresh
        $response = $this->postJson('/api/v1/auth/refresh', [], [
            'X-Tenant-ID' => $this->tenantId,
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'access_token',
                    'token_type',
                    'expires_in',
                ],
            ]);
    }
}
