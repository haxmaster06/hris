<?php

declare(strict_types=1);

namespace Modules\Employee\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Employee\Models\Employee;
use Modules\Employee\Models\EmployeeFamily;
use Modules\Employee\Models\EmployeeEducation;
use Modules\Employee\Models\EmployeeExperience;
use Modules\Employee\Models\EmployeeHistory;

class EmployeeRelationsTest extends TestCase
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
            'name' => 'Relations Test Tenant',
            'slug' => 'relationstest',
        ]);

        tenancy()->initialize($this->tenant);
    }

    public function test_employee_relationships_and_factories(): void
    {
        $employee = Employee::factory()->create([
            'first_name' => 'Robert',
            'last_name' => 'Downey',
        ]);

        $this->assertNotNull($employee->id);
        $this->assertEquals('Robert Downey', $employee->first_name . ' ' . $employee->last_name);

        // Test Family relation
        $family = EmployeeFamily::factory()->create([
            'employee_id' => $employee->id,
            'name' => 'Susan Downey',
            'relationship' => 'spouse',
        ]);

        $this->assertCount(1, $employee->family);
        $this->assertEquals('Susan Downey', $employee->family->first()->name);
        $this->assertInstanceOf(Employee::class, $family->employee);

        // Test Education relation
        $education = EmployeeEducation::factory()->create([
            'employee_id' => $employee->id,
            'institution' => 'MIT',
        ]);

        $this->assertCount(1, $employee->education);
        $this->assertEquals('MIT', $employee->education->first()->institution);
        $this->assertInstanceOf(Employee::class, $education->employee);

        // Test Experience relation
        $experience = EmployeeExperience::factory()->create([
            'employee_id' => $employee->id,
            'company_name' => 'Stark Industries',
        ]);

        $this->assertCount(1, $employee->experience);
        $this->assertEquals('Stark Industries', $employee->experience->first()->company_name);
        $this->assertInstanceOf(Employee::class, $experience->employee);

        // Test History relation
        $history = EmployeeHistory::factory()->create([
            'employee_id' => $employee->id,
            'type' => 'promotion',
        ]);

        $this->assertCount(1, $employee->histories);
        $this->assertEquals('promotion', $employee->histories->first()->type);
        $this->assertInstanceOf(Employee::class, $history->employee);
    }
}
