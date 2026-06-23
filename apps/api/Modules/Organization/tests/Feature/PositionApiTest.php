<?php

declare(strict_types=1);

namespace Modules\Organization\Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Division;
use Modules\Organization\Models\Position;

class PositionApiTest extends TestCase
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
            'name' => 'Pos Test Tenant',
            'slug' => 'postest',
        ]);

        $this->tenant->domains()->create([
            'domain' => 'postest.local',
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

    public function test_can_list_positions(): void
    {
        tenancy()->initialize($this->tenant);
        Position::factory()->count(2)->create();
        tenancy()->end();

        $headers = $this->getAuthHeaders();
        $response = $this->getJson('/api/v1/positions', $headers);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'data' => [
                        '*' => ['id', 'department_id', 'division_id', 'name', 'code', 'job_description']
                    ]
                ]
            ]);
    }

    public function test_can_create_position(): void
    {
        tenancy()->initialize($this->tenant);
        $dept = Department::factory()->create();
        $div = Division::factory()->create(['department_id' => $dept->id]);
        $deptId = $dept->id;
        $divId = $div->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $posData = [
            'department_id' => $deptId,
            'division_id' => $divId,
            'name' => 'Lead Backend Engineer',
            'code' => 'LBE01',
            'job_description' => 'Design and develop robust backend REST APIs.'
        ];

        $response = $this->postJson('/api/v1/positions', $posData, $headers);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Lead Backend Engineer');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('positions', [
            'code' => 'LBE01',
            'department_id' => $deptId,
            'division_id' => $divId
        ]);
        tenancy()->end();
    }

    public function test_can_update_position(): void
    {
        tenancy()->initialize($this->tenant);
        $pos = Position::factory()->create(['name' => 'Old Position Name']);
        $id = $pos->id;
        $deptId = $pos->department_id;
        $divId = $pos->division_id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $updateData = [
            'department_id' => $deptId,
            'division_id' => $divId,
            'name' => 'Updated Position Name',
            'code' => $pos->code,
        ];

        $response = $this->putJson("/api/v1/positions/{$id}", $updateData, $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Position Name');
    }

    public function test_can_soft_delete_position(): void
    {
        tenancy()->initialize($this->tenant);
        $pos = Position::factory()->create();
        $id = $pos->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $response = $this->deleteJson("/api/v1/positions/{$id}", [], $headers);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Position deleted successfully');

        tenancy()->initialize($this->tenant);
        $this->assertSoftDeleted('positions', ['id' => $id]);
        tenancy()->end();
    }
}
