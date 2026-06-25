<?php

declare(strict_types=1);

namespace Modules\Workflow\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Workflow\Repositories\WorkflowStepRepositoryInterface;

class WorkflowStepController extends BaseController
{
    public function __construct(
        private readonly WorkflowStepRepositoryInterface $stepRepo
    ) {}

    public function index(string $definitionId): JsonResponse
    {
        Gate::authorize('workflow.definitions.read');
        $steps = $this->stepRepo->getStepsForDefinition($definitionId);
        return $this->successResponse($steps, 'Langkah alur kerja berhasil diambil.');
    }

    public function store(Request $request, string $definitionId): JsonResponse
    {
        Gate::authorize('workflow.definitions.update');
        $validated = $request->validate([
            'step_order' => 'required|integer|min:1',
            'name' => 'required|string|max:255',
            'approver_type' => 'required|string|in:role,specific_user,reports_to,department_head',
            'approver_role_id' => 'nullable|uuid',
            'approver_user_id' => 'nullable|uuid',
            'condition_expression' => 'nullable|array',
            'is_optional' => 'boolean',
            'sla_hours' => 'nullable|integer|min:1',
            'on_timeout' => 'string|in:escalate,auto_approve,auto_reject',
        ]);

        $step = $this->stepRepo->create(array_merge($validated, [
            'workflow_definition_id' => $definitionId,
        ]));

        return $this->createdResponse($step, 'Langkah alur kerja berhasil ditambahkan.');
    }

    public function show(string $definitionId, string $id): JsonResponse
    {
        Gate::authorize('workflow.definitions.read');
        $step = $this->stepRepo->findOrFail($id);
        return $this->successResponse($step, 'Langkah alur kerja berhasil diambil.');
    }

    public function update(Request $request, string $definitionId, string $id): JsonResponse
    {
        Gate::authorize('workflow.definitions.update');
        $validated = $request->validate([
            'step_order' => 'required|integer|min:1',
            'name' => 'required|string|max:255',
            'approver_type' => 'required|string|in:role,specific_user,reports_to,department_head',
            'approver_role_id' => 'nullable|uuid',
            'approver_user_id' => 'nullable|uuid',
            'condition_expression' => 'nullable|array',
            'is_optional' => 'boolean',
            'sla_hours' => 'nullable|integer|min:1',
            'on_timeout' => 'string|in:escalate,auto_approve,auto_reject',
        ]);

        $step = $this->stepRepo->update($id, $validated);
        return $this->successResponse($step, 'Langkah alur kerja berhasil diperbarui.');
    }

    public function destroy(string $definitionId, string $id): JsonResponse
    {
        Gate::authorize('workflow.definitions.update');
        $this->stepRepo->delete($id);
        return $this->successResponse(null, 'Langkah alur kerja berhasil dihapus.');
    }

    public function reorder(Request $request, string $definitionId): JsonResponse
    {
        Gate::authorize('workflow.definitions.update');
        $validated = $request->validate([
            'steps' => 'required|array',
            'steps.*' => 'required|uuid',
        ]);

        $this->stepRepo->reorder($definitionId, $validated['steps']);

        return $this->successResponse(null, 'Urutan langkah alur kerja berhasil diperbarui.');
    }
}
