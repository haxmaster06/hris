<?php

declare(strict_types=1);

namespace Modules\Organization\Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use App\Models\Tenant;
use Modules\Organization\Models\Company;
use Modules\Organization\Models\Branch;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Division;
use Modules\Organization\Models\Position;
use Modules\Organization\Models\Grade;

class OrganizationModelsTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        // Create and initialize tenant database context
        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Test Company',
            'slug' => 'testcompany',
        ]);
        
        tenancy()->initialize($this->tenant);
    }

    /**
     * Test Company model creation and relationships.
     */
    public function test_company_creation_and_relations(): void
    {
        $company = Company::factory()->create([
            'name' => 'Haxmaster HQ',
            'code' => 'HQ001',
        ]);

        $this->assertNotNull($company->id);
        $this->assertTrue(Str::isUuid($company->id));
        $this->assertEquals('Haxmaster HQ', $company->name);
        $this->assertEquals(1, $company->version);

        // Test Branch relationship
        $branch = Branch::factory()->create([
            'company_id' => $company->id,
            'name' => 'Main Branch',
        ]);

        $this->assertCount(1, $company->branches);
        $this->assertEquals($company->id, $branch->company->id);
    }

    /**
     * Test Branch model and relationships.
     */
    public function test_branch_creation_and_relations(): void
    {
        $branch = Branch::factory()->create();

        $this->assertNotNull($branch->id);
        $this->assertInstanceOf(Company::class, $branch->company);

        $department = Department::factory()->create([
            'branch_id' => $branch->id,
        ]);

        $this->assertCount(1, $branch->departments);
        $this->assertEquals($branch->id, $department->branch->id);
    }

    /**
     * Test Department self-referencing relationship.
     */
    public function test_department_hierarchical_relations(): void
    {
        $branch = Branch::factory()->create();
        
        $parentDept = Department::factory()->create([
            'branch_id' => $branch->id,
            'name' => 'HR Department',
        ]);

        $childDept = Department::factory()->create([
            'branch_id' => $branch->id,
            'parent_id' => $parentDept->id,
            'name' => 'Recruitment sub-dept',
        ]);

        $this->assertEquals($parentDept->id, $childDept->parent->id);
        $this->assertCount(1, $parentDept->children);
        $this->assertEquals('Recruitment sub-dept', $parentDept->children->first()->name);
    }

    /**
     * Test Division model and relations.
     */
    public function test_division_creation_and_relations(): void
    {
        $division = Division::factory()->create();

        $this->assertNotNull($division->id);
        $this->assertInstanceOf(Department::class, $division->department);
    }

    /**
     * Test Position model and relations.
     */
    public function test_position_creation_and_relations(): void
    {
        $position = Position::factory()->create();

        $this->assertNotNull($position->id);
        $this->assertInstanceOf(Department::class, $position->department);
        $this->assertInstanceOf(Division::class, $position->division);
    }

    /**
     * Test Grade model and attribute casting.
     */
    public function test_grade_creation_and_casting(): void
    {
        $grade = Grade::factory()->create([
            'min_salary' => 5000000,
            'max_salary' => 10000000,
            'level' => 3,
        ]);

        $this->assertNotNull($grade->id);
        $this->assertSame(3, $grade->level);
        $this->assertEquals('5000000.00', $grade->min_salary);
        $this->assertEquals('10000000.00', $grade->max_salary);
    }
}
