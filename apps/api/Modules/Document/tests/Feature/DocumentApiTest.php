<?php

declare(strict_types=1);

namespace Modules\Document\Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Document\Models\DocumentCategory;
use Modules\Document\Models\Document;
use Modules\Employee\Models\Employee;

class DocumentApiTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;
    private string $employeeId;
    private string $categoryId;

    protected function setUp(): void
    {
        parent::setUp();

        // Fake S3 storage
        Storage::fake('s3');

        $this->tenantId = (string) Str::uuid();

        // Create tenant
        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Document Test Tenant',
            'slug' => 'doctest',
        ]);

        tenancy()->initialize($this->tenant);

        // Create initial employee
        $employee = Employee::factory()->create();
        $this->employeeId = $employee->id;

        // Create initial document category
        $category = DocumentCategory::factory()->create([
            'name' => 'National ID',
            'code' => 'KTP',
        ]);
        $this->categoryId = $category->id;

        tenancy()->end();
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

    public function test_can_crud_document_categories(): void
    {
        $headers = $this->getAuthHeaders();

        // 1. Create Category
        $createResponse = $this->postJson('/api/v1/document-categories', [
            'name' => 'Tax Number Card',
            'code' => 'NPWP',
        ], $headers);

        $createResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'NPWP');

        $categoryId = $createResponse->json('data.id');

        // 2. List Categories
        $listResponse = $this->getJson('/api/v1/document-categories', $headers);
        $listResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        // 3. Show Category
        $showResponse = $this->getJson("/api/v1/document-categories/{$categoryId}", $headers);
        $showResponse->assertStatus(200)
            ->assertJsonPath('data.name', 'Tax Number Card');

        // 4. Update Category
        $updateResponse = $this->putJson("/api/v1/document-categories/{$categoryId}", [
            'name' => 'Tax ID Updated',
            'code' => 'NPWP-NEW',
        ], $headers);
        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.name', 'Tax ID Updated');

        // 5. Delete Category
        $deleteResponse = $this->deleteJson("/api/v1/document-categories/{$categoryId}", [], $headers);
        $deleteResponse->assertStatus(200);

        tenancy()->initialize($this->tenant);
        $this->assertSoftDeleted('document_categories', ['id' => $categoryId]);
        tenancy()->end();
    }

    public function test_can_upload_and_delete_generic_document(): void
    {
        $headers = $this->getAuthHeaders();

        $file = UploadedFile::fake()->create('document_ktp.pdf', 500, 'application/pdf');

        // 1. Upload generic document
        $response = $this->postJson('/api/v1/documents/upload', [
            'file' => $file,
            'employee_id' => $this->employeeId,
            'document_category_id' => $this->categoryId,
            'expiry_date' => '2030-12-31',
        ], $headers);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.original_name', 'document_ktp.pdf')
            ->assertJsonStructure(['data' => ['id', 'signed_url']]);

        $documentId = $response->json('data.id');
        $storagePath = $response->json('data.storage_path');

        // Verify S3 storage file exists
        Storage::disk('s3')->assertExists($storagePath);

        // 2. Show document and get signed URL
        $showResponse = $this->getJson("/api/v1/documents/{$documentId}", $headers);
        $showResponse->assertStatus(200)
            ->assertJsonStructure(['data' => ['signed_url']]);

        // 3. Delete document
        $deleteResponse = $this->deleteJson("/api/v1/documents/{$documentId}", [], $headers);
        $deleteResponse->assertStatus(200);

        // Verify storage file deleted
        Storage::disk('s3')->assertMissing($storagePath);

        tenancy()->initialize($this->tenant);
        $this->assertSoftDeleted('documents', ['id' => $documentId]);
        tenancy()->end();
    }

    public function test_can_manage_employee_specific_documents(): void
    {
        $headers = $this->getAuthHeaders();

        $file = UploadedFile::fake()->create('contract.pdf', 1000, 'application/pdf');

        // 1. Upload employee document
        $uploadResponse = $this->postJson("/api/v1/employees/{$this->employeeId}/documents", [
            'file' => $file,
            'document_category_id' => $this->categoryId,
        ], $headers);

        $uploadResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.employee_id', $this->employeeId);

        // 2. List employee documents
        $listResponse = $this->getJson("/api/v1/employees/{$this->employeeId}/documents", $headers);
        $listResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'data' => [
                        '*' => ['id', 'employee_id', 'original_name', 'signed_url']
                    ]
                ]
            ]);
    }
}
