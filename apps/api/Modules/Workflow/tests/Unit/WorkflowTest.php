<?php

declare(strict_types=1);

namespace Modules\Workflow\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use App\Models\User;
use Modules\Workflow\Models\WorkflowDefinition;
use Modules\Workflow\Models\WorkflowStep;
use Modules\Workflow\Models\WorkflowInstance;
use Modules\Workflow\Services\WorkflowEngine;
use Modules\Leave\Models\LeaveRequest;
use Spatie\Permission\Models\Role;

class WorkflowTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;
    private WorkflowEngine $engine;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Workflow Test Tenant',
            'slug' => 'workflowtest',
        ]);

        tenancy()->initialize($this->tenant);
        $this->engine = app(WorkflowEngine::class);
    }

    public function test_workflow_initiation_and_steps(): void
    {
        $initiator = User::factory()->create();
        $approver = User::factory()->create();

        // 1. Buat definisi workflow
        $def = WorkflowDefinition::factory()->create([
            'name' => 'Leave Approval Flow',
            'module' => 'leave',
            'entity_type' => LeaveRequest::class,
        ]);

        // 2. Buat steps
        $step1 = WorkflowStep::factory()->create([
            'workflow_definition_id' => $def->id,
            'step_order' => 1,
            'name' => 'Manager Review',
            'approver_type' => 'specific_user',
            'approver_user_id' => $approver->id,
        ]);

        // Dummy entity target (LeaveRequest)
        // Kita butuh employee untuk relasi
        $employee = \Modules\Employee\Models\Employee::factory()->create([
            'user_id' => $initiator->id,
        ]);

        $leave = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'status' => 'draft',
        ]);

        // Initiate workflow
        $instance = $this->engine->initiate($def, $leave, $initiator);

        $this->assertNotNull($instance);
        $this->assertEquals('in_progress', $instance->status);
        $this->assertEquals(1, $instance->current_step_order);
    }

    public function test_workflow_approval_flow(): void
    {
        $initiator = User::factory()->create();
        $approver = User::factory()->create();

        $def = WorkflowDefinition::factory()->create([
            'entity_type' => LeaveRequest::class,
        ]);

        $step1 = WorkflowStep::factory()->create([
            'workflow_definition_id' => $def->id,
            'step_order' => 1,
            'name' => 'Step 1',
            'approver_type' => 'specific_user',
            'approver_user_id' => $approver->id,
        ]);

        $employee = \Modules\Employee\Models\Employee::factory()->create([
            'user_id' => $initiator->id,
        ]);

        $leave = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'status' => 'draft',
        ]);

        // Initiate
        $instance = $this->engine->initiate($def, $leave, $initiator);

        // Approve
        $updatedInstance = $this->engine->approve($instance, $approver, 'Approved by me');

        // Karena hanya ada 1 step, setelah di-approve maka status alur harusnya 'approved'
        $this->assertEquals('approved', $updatedInstance->status);
        $this->assertNotNull($updatedInstance->completed_at);

        // Target status should also update to approved (fallback update column)
        $this->assertEquals('approved', $leave->fresh()->status);
    }

    public function test_workflow_rejection_flow(): void
    {
        $initiator = User::factory()->create();
        $approver = User::factory()->create();

        $def = WorkflowDefinition::factory()->create([
            'entity_type' => LeaveRequest::class,
        ]);

        $step1 = WorkflowStep::factory()->create([
            'workflow_definition_id' => $def->id,
            'step_order' => 1,
            'approver_type' => 'specific_user',
            'approver_user_id' => $approver->id,
        ]);

        $employee = \Modules\Employee\Models\Employee::factory()->create([
            'user_id' => $initiator->id,
        ]);

        $leave = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'status' => 'draft',
        ]);

        // Initiate
        $instance = $this->engine->initiate($def, $leave, $initiator);

        // Reject
        $updatedInstance = $this->engine->reject($instance, $approver, 'Rejected reason');

        $this->assertEquals('rejected', $updatedInstance->status);
        $this->assertEquals('rejected', $leave->fresh()->status);
    }

    public function test_workflow_conditional_skipping(): void
    {
        $initiator = User::factory()->create();
        $approver1 = User::factory()->create();
        $approver2 = User::factory()->create();

        $def = WorkflowDefinition::factory()->create([
            'entity_type' => LeaveRequest::class,
        ]);

        // Step 1: Hanya dievaluasi jika total_days > 5
        $step1 = WorkflowStep::factory()->create([
            'workflow_definition_id' => $def->id,
            'step_order' => 1,
            'name' => 'Conditional Step',
            'approver_type' => 'specific_user',
            'approver_user_id' => $approver1->id,
            'condition_expression' => [
                'field' => 'total_days',
                'operator' => '>',
                'value' => 5,
            ],
        ]);

        // Step 2: Final approval (selalu berjalan)
        $step2 = WorkflowStep::factory()->create([
            'workflow_definition_id' => $def->id,
            'step_order' => 2,
            'name' => 'Final Step',
            'approver_type' => 'specific_user',
            'approver_user_id' => $approver2->id,
        ]);

        $employee = \Modules\Employee\Models\Employee::factory()->create([
            'user_id' => $initiator->id,
        ]);

        // Kasus 1: target model memiliki total_days = 3. Step 1 harus dilompati karena 3 <= 5.
        $leave = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'total_days' => 3,
            'status' => 'draft',
        ]);

        $instance = $this->engine->initiate($def, $leave, $initiator);

        $this->assertEquals(2, $instance->current_step_order); // Melompati step 1
    }
}
