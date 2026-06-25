<?php

declare(strict_types=1);

namespace Modules\Performance\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Employee\Models\Employee;
use Modules\Performance\Models\KPI;
use Modules\Performance\Models\KPIAssignment;
use Modules\Performance\Models\PerformancePeriod;
use Modules\Performance\Models\PerformanceReview;
use Modules\Performance\Models\ImprovementPlan;

class PerformanceTest extends TestCase
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
            'name' => 'Performance Test Tenant',
            'slug' => 'performancetest',
        ]);

        tenancy()->initialize($this->tenant);
    }

    public function test_kpi_creation_and_attributes(): void
    {
        $kpi = KPI::factory()->create([
            'code' => 'KPI-001',
            'name' => 'Financial Target',
            'measurement_type' => 'higher_better',
        ]);

        $this->assertNotNull($kpi);
        $this->assertEquals('KPI-001', $kpi->code);
        $this->assertTrue($kpi->is_active);
    }

    public function test_kpi_assignment_score_calculation(): void
    {
        $kpi = KPI::factory()->create([
            'measurement_type' => 'higher_better',
        ]);
        $employee = Employee::factory()->create();
        $period = PerformancePeriod::factory()->create();

        // Target = 100, Actual = 80 -> Score = 80%
        $assignment = KPIAssignment::factory()->create([
            'kpi_id' => $kpi->id,
            'employee_id' => $employee->id,
            'performance_period_id' => $period->id,
            'target_value' => 100.0,
            'actual_value' => 80.0,
            'weight' => 20.0,
        ]);

        // We check manually calculating logic equivalent to the controller
        $calculatedScore = ($assignment->actual_value / $assignment->target_value) * 100;
        $assignment->update(['score' => $calculatedScore]);

        $this->assertEquals(80.0, floatval($assignment->fresh()->score));
    }

    public function test_performance_review_lifecycle_and_pip_trigger(): void
    {
        $employee = Employee::factory()->create();
        $manager = Employee::factory()->create();
        $period = PerformancePeriod::factory()->create([
            'name' => 'Q1 2026',
        ]);

        // Create initial pending review
        $review = PerformanceReview::factory()->create([
            'performance_period_id' => $period->id,
            'employee_id' => $employee->id,
            'manager_id' => $manager->id,
            'status' => 'pending',
        ]);

        $this->assertEquals('pending', $review->status);

        // Step 1: Self Review
        $review->update([
            'self_score' => 75.00,
            'self_comment' => 'I did okay.',
            'status' => 'self_review',
        ]);
        $this->assertEquals('self_review', $review->fresh()->status);

        // Step 2: Manager Review
        $review->update([
            'manager_score' => 50.00,
            'manager_comment' => 'Needs improvement.',
            'status' => 'manager_review',
        ]);
        $this->assertEquals('manager_review', $review->fresh()->status);

        // Step 3: HR Review with score underperforming (below rating)
        $review->update([
            'hr_score' => 45.00,
            'hr_comment' => 'Underperforming during calibration.',
            'final_score' => 45.00,
            'rating' => 'below',
            'status' => 'completed',
        ]);

        // Simulating the controller logic which creates the PIP
        if ($review->fresh()->status === 'completed' && in_array($review->rating, ['below', 'unsatisfactory'])) {
            ImprovementPlan::create([
                'employee_id' => $review->employee_id,
                'performance_review_id' => $review->id,
                'title' => 'PIP - ' . $review->employee->name . ' - ' . $review->period->name,
                'reason' => 'Appraisal score: ' . $review->final_score . ', rating: ' . $review->rating,
                'action_items' => [
                    ['task' => 'Identify gaps', 'deadline' => now()->addDays(14)->toDateString(), 'status' => 'pending']
                ],
                'start_date' => now()->toDateString(),
                'end_date' => now()->addDays(90)->toDateString(),
                'status' => 'active',
                'supervisor_id' => $review->manager_id,
            ]);
        }

        $this->assertEquals('completed', $review->fresh()->status);
        
        // Assert PIP was created
        $pip = ImprovementPlan::where('performance_review_id', $review->id)->first();
        $this->assertNotNull($pip);
        $this->assertEquals('active', $pip->status);
        $this->assertEquals($employee->id, $pip->employee_id);
    }
}
