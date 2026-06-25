<?php

declare(strict_types=1);

namespace Modules\Talent\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Talent\Models\Skill;
use Modules\Talent\Models\EmployeeSkill;
use Modules\Talent\Models\CareerPath;
use Modules\Talent\Models\SuccessionPlan;
use Modules\Organization\Models\Position;
use Modules\Employee\Models\Employee;

class TalentTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Talent Test Tenant',
            'slug' => 'talenttest',
        ]);

        tenancy()->initialize($this->tenant);
    }

    public function test_skill_attributes_and_active(): void
    {
        $skill = Skill::factory()->create([
            'name' => 'React Programming',
            'category' => 'technical',
        ]);

        $this->assertNotNull($skill);
        $this->assertEquals('React Programming', $skill->name);
        $this->assertTrue($skill->is_active);
    }

    public function test_employee_skill_assessment(): void
    {
        $employee = Employee::factory()->create();
        $skill = Skill::factory()->create();
        $assessor = Employee::factory()->create();

        $empSkill = EmployeeSkill::create([
            'employee_id' => $employee->id,
            'skill_id' => $skill->id,
            'proficiency_level' => 4, // Advanced
            'assessed_at' => now()->toDateString(),
            'assessed_by' => $assessor->id,
        ]);

        $this->assertEquals(4, $empSkill->proficiency_level);
        $this->assertEquals($employee->id, $empSkill->employee_id);
    }

    public function test_career_path_positions_mapping(): void
    {
        $fromPosition = Position::factory()->create(['name' => 'Junior Developer']);
        $toPosition = Position::factory()->create(['name' => 'Senior Developer']);

        $path = CareerPath::create([
            'from_position_id' => $fromPosition->id,
            'to_position_id' => $toPosition->id,
            'path_type' => 'promotion',
            'typical_years' => 2,
            'requirements' => [
                ['type' => 'skill', 'name' => 'Laravel', 'level' => 4]
            ],
        ]);

        $this->assertEquals($fromPosition->id, $path->from_position_id);
        $this->assertEquals($toPosition->id, $path->to_position_id);
        $this->assertEquals(2, $path->typical_years);
    }

    public function test_succession_plan_readiness_and_nine_box_coordinates(): void
    {
        $position = Position::factory()->create(['name' => 'Engineering Lead']);
        $incumbent = Employee::factory()->create();
        $candidate = Employee::factory()->create();

        $plan = SuccessionPlan::create([
            'position_id' => $position->id,
            'incumbent_employee_id' => $incumbent->id,
            'candidate_employee_id' => $candidate->id,
            'readiness_level' => 'ready_now',
            'potential_score' => 85.00,
            'performance_score' => 90.00,
        ]);

        $this->assertEquals('ready_now', $plan->readiness_level);

        // Verify coordinate evaluation (High Potential + High Performance -> Star quadrant)
        $perf = (float) $plan->performance_score;
        $pot = (float) $plan->potential_score;

        $perfLevel = $perf < 40 ? 'low' : ($perf <= 75 ? 'med' : 'high');
        $potLevel = $pot < 40 ? 'low' : ($pot <= 75 ? 'med' : 'high');

        $coordinate = "{$potLevel}_{$perfLevel}";
        $this->assertEquals('high_high', $coordinate);
    }
}
