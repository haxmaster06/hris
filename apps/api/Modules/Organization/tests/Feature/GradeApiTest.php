<?php

declare(strict_types=1);

namespace Modules\Organization\Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Organization\Models\Grade;

class GradeApiTest extends TestCase
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
            'name' => 'Grade Test Tenant',
            'slug' => 'gradetest',
        ]);

        $this->tenant->domains()->create([
            'domain' => 'gradetest.local',
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

    public function test_can_list_grades(): void
    {
        tenancy()->initialize($this->tenant);
        Grade::factory()->count(2)->create();
        tenancy()->end();

        $headers = $this->getAuthHeaders();
        $response = $this->getJson('/api/v1/grades', $headers);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'data' => [
                        '*' => ['id', 'name', 'code', 'level', 'min_salary', 'max_salary']
                    ]
                ]
            ]);
    }

    public function test_can_create_grade(): void
    {
        $headers = $this->getAuthHeaders();

        $gradeData = [
            'name' => 'Manager Grade',
            'code' => 'GR-M1',
            'level' => 5,
            'min_salary' => 15000000.00,
            'max_salary' => 25000000.00
        ];

        $response = $this->postJson('/api/v1/grades', $gradeData, $headers);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Manager Grade')
            ->assertJsonPath('data.level', 5);

        tenancy()->initialize($this->tenant);
        $this->assertDatabaseHas('grades', [
            'code' => 'GR-M1',
            'level' => 5
        ]);
        tenancy()->end();
    }

    public function test_cannot_create_grade_with_max_salary_less_than_min_salary(): void
    {
        $headers = $this->getAuthHeaders();

        $gradeData = [
            'name' => 'Invalid Salary Grade',
            'code' => 'GR-INV',
            'level' => 3,
            'min_salary' => 8000000.00,
            'max_salary' => 5000000.00 // invalid: less than min_salary
        ];

        $response = $this->postJson('/api/v1/grades', $gradeData, $headers);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['max_salary']);
    }

    public function test_can_update_grade(): void
    {
        tenancy()->initialize($this->tenant);
        $grade = Grade::factory()->create(['name' => 'Old Grade Name']);
        $id = $grade->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $updateData = [
            'name' => 'Updated Grade Name',
            'code' => $grade->code,
            'level' => $grade->level,
            'min_salary' => $grade->min_salary,
            'max_salary' => $grade->max_salary
        ];

        $response = $this->putJson("/api/v1/grades/{$id}", $updateData, $headers);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Grade Name');
    }

    public function test_can_soft_delete_grade(): void
    {
        tenancy()->initialize($this->tenant);
        $grade = Grade::factory()->create();
        $id = $grade->id;
        tenancy()->end();

        $headers = $this->getAuthHeaders();

        $response = $this->deleteJson("/api/v1/grades/{$id}", [], $headers);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Grade deleted successfully');

        tenancy()->initialize($this->tenant);
        $this->assertSoftDeleted('grades', ['id' => $id]);
        tenancy()->end();
    }
}
