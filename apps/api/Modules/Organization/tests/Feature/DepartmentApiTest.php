<?php

declare(strict_types=1);

namespace Modules\Organization\Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Organization\Models\Branch;
use Modules\Organization\Models\Department;

class DepartmentApiTest extends TestCase
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
            'name' => 'Dept Test Tenant',
            'slug' => 'depttest',
        ]);

        $this->tenant->domains()->create([
            'domain' => 'depttest.local',
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

    public function test_can_list_departments(): void
    {
        tenancy()->initialize($this->tenant);
        Department::factory()->count(2)->create();
        tenancy()->end();

        $headers = $this->getAuthHeaders();
        $response = $this->getJson('/api/v1/departments', $headers);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'data' => [
                        '*' => ['id', 'branch_id', 'parent_id', 'name', 'code']
                    ]
                ]
            ]);
    }

    public function test_can_create_department(): void
    {
        tenancy()->initialize($this->tenant);
        $branch = Branch::factory()->create();
        $branchId = $branch->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $deptData = [
            'branch_id' => $branchId,
            'name' => 'IT Operations',
            'code' => 'IT01',
        ];

        $response = $this->postJson('/api/v1/departments', $deptData, $headers);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'IT Operations');

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('departments', [
            'code' => 'IT01',
            'branch_id' => $branchId
        ]);
        tenancy()->end();
    }

    public function test_can_update_department(): void
    {
        tenancy()->initialize($this->tenant);
        $dept = Department::factory()->create(['name' => 'Old Department Name']);
        $id = $dept->id;
        $branchId = $dept->branch_id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $updateData = [
            'branch_id' => $branchId,
            'name' => 'Updated Department Name',
            'code' => $dept->code,
        ];

        $response = $this->putJson("/api/v1/departments/{$id}", $updateData, $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Department Name');
    }

    public function test_prevent_circular_dependency_on_update(): void
    {
        tenancy()->initialize($this->tenant);
        $branch = Branch::factory()->create();
        
        $deptA = Department::factory()->create(['branch_id' => $branch->id, 'name' => 'Dept A', 'code' => 'DA']);
        $deptB = Department::factory()->create(['branch_id' => $branch->id, 'parent_id' => $deptA->id, 'name' => 'Dept B', 'code' => 'DB']);
        $deptC = Department::factory()->create(['branch_id' => $branch->id, 'parent_id' => $deptB->id, 'name' => 'Dept C', 'code' => 'DC']);
        
        $idA = $deptA->id;
        $idC = $deptC->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        // Attempting to set Dept C as the parent of Dept A (Dept C is descendant of Dept A)
        $updateData = [
            'branch_id' => $branch->id,
            'parent_id' => $idC, // circular!
            'name' => 'Dept A',
            'code' => 'DA'
        ];

        $response = $this->putJson("/api/v1/departments/{$idA}", $updateData, $headers);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['parent_id']);
    }

    public function test_can_soft_delete_department(): void
    {
        tenancy()->initialize($this->tenant);
        $dept = Department::factory()->create();
        $id = $dept->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $response = $this->deleteJson("/api/v1/departments/{$id}", [], $headers);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Department deleted successfully');

        tenancy()->initialize($this->tenant);
        $this->assertSoftDeleted('departments', ['id' => $id]);
        tenancy()->end();
    }
}
