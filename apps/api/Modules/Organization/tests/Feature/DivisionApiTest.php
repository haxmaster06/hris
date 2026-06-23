<?php

declare(strict_types=1);

namespace Modules\Organization\Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Division;

class DivisionApiTest extends TestCase
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
            'name' => 'Div Test Tenant',
            'slug' => 'divtest',
        ]);

        $this->tenant->domains()->create([
            'domain' => 'divtest.local',
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

    public function test_can_list_divisions(): void
    {
        tenancy()->initialize($this->tenant);
        Division::factory()->count(2)->create();
        tenancy()->end();

        $headers = $this->getAuthHeaders();
        $response = $this->getJson('/api/v1/divisions', $headers);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'data' => [
                        '*' => ['id', 'department_id', 'name', 'code']
                    ]
                ]
            ]);
    }

    public function test_can_create_division(): void
    {
        tenancy()->initialize($this->tenant);
        $dept = Department::factory()->create();
        $deptId = $dept->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $divData = [
            'department_id' => $deptId,
            'name' => 'Software Engineering',
            'code' => 'SWE01',
        ];

        $response = $this->postJson('/api/v1/divisions', $divData, $headers);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Software Engineering');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('divisions', [
            'code' => 'SWE01',
            'department_id' => $deptId
        ]);
        tenancy()->end();
    }

    public function test_can_update_division(): void
    {
        tenancy()->initialize($this->tenant);
        $div = Division::factory()->create(['name' => 'Old Division Name']);
        $id = $div->id;
        $deptId = $div->department_id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $updateData = [
            'department_id' => $deptId,
            'name' => 'Updated Division Name',
            'code' => $div->code,
        ];

        $response = $this->putJson("/api/v1/divisions/{$id}", $updateData, $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Division Name');
    }

    public function test_can_soft_delete_division(): void
    {
        tenancy()->initialize($this->tenant);
        $div = Division::factory()->create();
        $id = $div->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $response = $this->deleteJson("/api/v1/divisions/{$id}", [], $headers);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Division deleted successfully');

        tenancy()->initialize($this->tenant);
        $this->assertSoftDeleted('divisions', ['id' => $id]);
        tenancy()->end();
    }
}
