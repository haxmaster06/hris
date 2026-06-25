<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Employee\Models\Employee;
use Modules\Employee\Models\EmployeeHistory;
use Modules\Organization\Models\Position;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Branch;
use Modules\EmployeeLifecycle\Models\LifecycleEvent;
use Modules\EmployeeLifecycle\Models\OnboardingChecklist;
use Modules\EmployeeLifecycle\Services\LifecycleEventService;
use Modules\EmployeeLifecycle\Services\OnboardingChecklistService;

class LifecycleEventTest extends TestCase
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
            'name' => 'Lifecycle Test Tenant',
            'slug' => 'lifecycletest',
        ]);

        tenancy()->initialize($this->tenant);
    }

    public function test_lifecycle_event_relations_and_factory(): void
    {
        $employee = Employee::factory()->create();
        $posFrom = Position::factory()->create();
        $posTo = Position::factory()->create();

        $event = LifecycleEvent::factory()->create([
            'employee_id' => $employee->id,
            'event_type' => 'promotion',
            'from_position_id' => $posFrom->id,
            'to_position_id' => $posTo->id,
            'status' => 'draft',
        ]);

        $this->assertNotNull($event->id);
        $this->assertInstanceOf(Employee::class, $event->employee);
        $this->assertInstanceOf(Position::class, $event->fromPosition);
        $this->assertInstanceOf(Position::class, $event->toPosition);
        $this->assertEquals('draft', $event->status);
    }

    public function test_lifecycle_event_execution_updates_employee_and_logs_history(): void
    {
        $branch = Branch::factory()->create();
        $department = Department::factory()->create(['branch_id' => $branch->id]);
        
        $posFrom = Position::factory()->create(['department_id' => $department->id]);
        $posTo = Position::factory()->create(['department_id' => $department->id]);

        $employee = Employee::factory()->create([
            'company_id' => $branch->company_id,
            'branch_id' => $branch->id,
            'department_id' => $department->id,
            'position_id' => $posFrom->id,
            'status' => 'probation',
        ]);

        $service = app(LifecycleEventService::class);

        $event = $service->create([
            'employee_id' => $employee->id,
            'event_type' => 'promotion',
            'effective_date' => now()->toDateString(),
            'to_position_id' => $posTo->id,
            'to_status' => 'permanent',
            'reason' => 'Excellent performance',
            'status' => 'draft',
        ]);

        // Execute the lifecycle event
        $executedEvent = $service->execute($event->id);

        $this->assertEquals('executed', $executedEvent->status);
        $this->assertNotNull($executedEvent->approved_at);

        // Verify employee changes
        $updatedEmployee = $employee->fresh();
        $this->assertEquals($posTo->id, $updatedEmployee->position_id);
        $this->assertEquals('permanent', $updatedEmployee->status);

        // Verify history logs
        $histories = EmployeeHistory::where('employee_id', $employee->id)->get();
        $this->assertCount(2, $histories); // Position change and status change

        $posHistory = $histories->where('field', 'position_id')->first();
        $this->assertNotNull($posHistory);
        $this->assertEquals('promotion', $posHistory->type);
        $this->assertEquals($posFrom->id, $posHistory->old_value);
        $this->assertEquals($posTo->id, $posHistory->new_value);

        $statusHistory = $histories->where('field', 'status')->first();
        $this->assertNotNull($statusHistory);
        $this->assertEquals('permanent', $statusHistory->new_value);
    }

    public function test_onboarding_checklist_completion(): void
    {
        $employee = Employee::factory()->create();
        $service = app(OnboardingChecklistService::class);

        $task = $service->create([
            'employee_id' => $employee->id,
            'category' => 'document',
            'task_name' => 'Submit KTP Copy',
            'is_completed' => false,
        ]);

        $this->assertFalse($task->is_completed);
        $this->assertNull($task->completed_at);

        // Complete task
        $completedTask = $service->complete($task->id, true);

        $this->assertTrue($completedTask->is_completed);
        $this->assertNotNull($completedTask->completed_at);

        // Revert task
        $revertedTask = $service->complete($task->id, false);

        $this->assertFalse($revertedTask->is_completed);
        $this->assertNull($revertedTask->completed_at);
    }
}
