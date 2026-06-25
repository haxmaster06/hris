<?php

declare(strict_types=1);

namespace Modules\Employee\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Employee\Models\Employee;
use Modules\Employee\Models\EmergencyContact;
use Modules\Employee\Services\EmergencyContactService;

class EmergencyContactTest extends TestCase
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
            'name' => 'Emergency Contact Test Tenant',
            'slug' => 'emergencycontacttest',
        ]);

        tenancy()->initialize($this->tenant);
    }

    public function test_emergency_contact_relationships_and_factory(): void
    {
        $employee = Employee::factory()->create();

        $contact = EmergencyContact::factory()->create([
            'employee_id' => $employee->id,
            'name' => 'John Doe',
            'relationship' => 'parent',
            'phone' => '1234567890',
            'is_primary' => true,
        ]);

        $this->assertNotNull($contact->id);
        $this->assertInstanceOf(Employee::class, $contact->employee);
        $this->assertEquals($employee->id, $contact->employee->id);
        
        $employee->load('emergencyContacts');
        $this->assertCount(1, $employee->emergencyContacts);
        $this->assertEquals('John Doe', $employee->emergencyContacts->first()->name);
        $this->assertTrue($contact->is_primary);
    }

    public function test_primary_exclusivity_via_service(): void
    {
        $employee = Employee::factory()->create();

        // Use service to create the first primary contact
        $service = app(EmergencyContactService::class);

        $contact1 = $service->create([
            'employee_id' => $employee->id,
            'name' => 'John Doe',
            'relationship' => 'parent',
            'phone' => '1234567890',
            'is_primary' => true,
        ]);

        $this->assertTrue($contact1->fresh()->is_primary);

        // Create second primary contact
        $contact2 = $service->create([
            'employee_id' => $employee->id,
            'name' => 'Jane Doe',
            'relationship' => 'spouse',
            'phone' => '0987654321',
            'is_primary' => true,
        ]);

        $this->assertTrue($contact2->fresh()->is_primary);
        $this->assertFalse($contact1->fresh()->is_primary); // Should be unset

        // Create a non-primary contact, should not affect existing primary contact
        $contact3 = $service->create([
            'employee_id' => $employee->id,
            'name' => 'Bob Doe',
            'relationship' => 'sibling',
            'phone' => '111222333',
            'is_primary' => false,
        ]);

        $this->assertFalse($contact3->fresh()->is_primary);
        $this->assertTrue($contact2->fresh()->is_primary);
    }
}
