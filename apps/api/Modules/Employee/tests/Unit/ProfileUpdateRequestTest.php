<?php

declare(strict_types=1);

namespace Modules\Employee\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Employee\Models\Employee;
use Modules\Employee\Models\ProfileUpdateRequest;

class ProfileUpdateRequestTest extends TestCase
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
            'name' => 'Profile Update Test Tenant',
            'slug' => 'profileupdatetest',
        ]);

        tenancy()->initialize($this->tenant);
    }

    public function test_profile_update_request_relationships_and_factory(): void
    {
        $employee = Employee::factory()->create(['phone' => '12345678']);
        $approver = Employee::factory()->create();

        $request = ProfileUpdateRequest::factory()->create([
            'employee_id' => $employee->id,
            'field_name' => 'phone',
            'old_value' => '12345678',
            'new_value' => '99998888',
            'status' => 'pending',
        ]);

        $this->assertNotNull($request->id);
        $this->assertInstanceOf(Employee::class, $request->employee);
        $this->assertEquals($employee->id, $request->employee->id);
        $this->assertEquals('pending', $request->status);
    }
}
