<?php

declare(strict_types=1);

namespace Modules\Organization\Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Organization\Models\Company;

class CompanyApiTest extends TestCase
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
            'name' => 'Company Test Tenant',
            'slug' => 'companytest',
        ]);

        $this->tenant->domains()->create([
            'domain' => 'companytest.local',
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

    public function test_can_list_companies(): void
    {
        tenancy()->initialize($this->tenant);
        Company::factory()->count(3)->create();
        tenancy()->end();

        $headers = $this->getAuthHeaders();
        $response = $this->getJson('/api/v1/companies', $headers);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'data' => [
                        '*' => ['id', 'name', 'code', 'created_at', 'updated_at', 'version']
                    ],
                    'meta' => ['total', 'count', 'per_page', 'current_page', 'total_pages']
                ]
            ]);
    }

    public function test_can_create_company(): void
    {
        $headers = $this->getAuthHeaders();

        $companyData = [
            'name' => 'New Test Company',
            'code' => 'NTC001',
            'tax_number' => '12.345.678.9-012.000',
            'address' => 'Jakarta, Indonesia',
            'phone' => '021-123456',
            'email' => 'contact@newtest.com'
        ];

        $response = $this->postJson('/api/v1/companies', $companyData, $headers);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'New Test Company')
            ->assertJsonPath('data.code', 'NTC001');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('companies', [
            'code' => 'NTC001',
            'name' => 'New Test Company'
        ]);
        tenancy()->end();
    }

    public function test_cannot_create_company_with_duplicate_code(): void
    {
        tenancy()->initialize($this->tenant);
        Company::factory()->create(['code' => 'DUP01']);
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $companyData = [
            'name' => 'Duplicate Company',
            'code' => 'DUP01',
        ];

        $response = $this->postJson('/api/v1/companies', $companyData, $headers);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_can_show_company(): void
    {
        tenancy()->initialize($this->tenant);
        $company = Company::factory()->create();
        $id = $company->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $response = $this->getJson("/api/v1/companies/{$id}", $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $id);
    }

    public function test_can_update_company(): void
    {
        tenancy()->initialize($this->tenant);
        $company = Company::factory()->create(['name' => 'Old Name', 'code' => 'OLD01']);
        $id = $company->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $updateData = [
            'name' => 'Updated Name',
            'code' => 'OLD01',
            'tax_number' => '99.999.999.9-999.000',
        ];

        $response = $this->putJson("/api/v1/companies/{$id}", $updateData, $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Name');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('companies', [
            'id' => $id,
            'name' => 'Updated Name'
        ]);
        tenancy()->end();
    }

    public function test_can_soft_delete_company(): void
    {
        tenancy()->initialize($this->tenant);
        $company = Company::factory()->create();
        $id = $company->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $response = $this->deleteJson("/api/v1/companies/{$id}", [], $headers);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Company deleted successfully');

        tenancy()->initialize($this->tenant);
        $this->assertSoftDeleted('companies', ['id' => $id]);
        tenancy()->end();
    }
}
