<?php

declare(strict_types=1);

namespace Modules\Organization\Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Organization\Models\Company;
use Modules\Organization\Models\Branch;

class BranchApiTest extends TestCase
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
            'name' => 'Branch Test Tenant',
            'slug' => 'branchtest',
        ]);

        $this->tenant->domains()->create([
            'domain' => 'branchtest.local',
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

    public function test_can_list_branches(): void
    {
        tenancy()->initialize($this->tenant);
        Branch::factory()->count(2)->create();
        tenancy()->end();

        $headers = $this->getAuthHeaders();
        $response = $this->getJson('/api/v1/branches', $headers);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'data' => [
                        '*' => ['id', 'company_id', 'name', 'code', 'created_at', 'updated_at', 'version']
                    ]
                ]
            ]);
    }

    public function test_can_create_branch(): void
    {
        tenancy()->initialize($this->tenant);
        $company = Company::factory()->create();
        $companyId = $company->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $branchData = [
            'company_id' => $companyId,
            'name' => 'New Branch HQ',
            'code' => 'BHQ01',
            'address' => 'Bandung, Indonesia',
            'phone' => '022-987654'
        ];

        $response = $this->postJson('/api/v1/branches', $branchData, $headers);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'New Branch HQ');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('branches', [
            'code' => 'BHQ01',
            'company_id' => $companyId
        ]);
        tenancy()->end();
    }

    public function test_can_show_branch_with_company_include(): void
    {
        tenancy()->initialize($this->tenant);
        $branch = Branch::factory()->create();
        $id = $branch->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $response = $this->getJson("/api/v1/branches/{$id}?include=company", $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $id)
            ->assertJsonStructure([
                'data' => [
                    'company' => ['id', 'name', 'code']
                ]
            ]);
    }

    public function test_can_update_branch(): void
    {
        tenancy()->initialize($this->tenant);
        $branch = Branch::factory()->create(['name' => 'Old Branch Name']);
        $id = $branch->id;
        $companyId = $branch->company_id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $updateData = [
            'company_id' => $companyId,
            'name' => 'Updated Branch Name',
            'code' => $branch->code,
        ];

        $response = $this->putJson("/api/v1/branches/{$id}", $updateData, $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Branch Name');
    }

    public function test_can_soft_delete_branch(): void
    {
        tenancy()->initialize($this->tenant);
        $branch = Branch::factory()->create();
        $id = $branch->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $response = $this->deleteJson("/api/v1/branches/{$id}", [], $headers);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Branch deleted successfully');

        tenancy()->initialize($this->tenant);
        $this->assertSoftDeleted('branches', ['id' => $id]);
        tenancy()->end();
    }
}
