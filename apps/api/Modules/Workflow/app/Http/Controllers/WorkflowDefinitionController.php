<?php

declare(strict_types=1);

namespace Modules\Workflow\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Workflow\Repositories\WorkflowDefinitionRepositoryInterface;
use Modules\Workflow\Repositories\WorkflowStepRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Exception;

class WorkflowDefinitionController extends BaseController
{
    public function __construct(
        private readonly WorkflowDefinitionRepositoryInterface $definitionRepo,
        private readonly WorkflowStepRepositoryInterface $stepRepo
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('workflow.definitions.read');

        $definitions = $this->definitionRepo->paginate($request->all());

        return $this->successResponse(
            $definitions,
            'Definisi alur kerja berhasil diambil.'
        );
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('workflow.definitions.create');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'module' => 'required|string|max:50',
            'entity_type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'steps' => 'required|array|min:1',
            'steps.*.step_order' => 'required|integer|min:1',
            'steps.*.name' => 'required|string|max:255',
            'steps.*.approver_type' => 'required|string|in:role,specific_user,reports_to,department_head',
            'steps.*.approver_role_id' => 'nullable|uuid',
            'steps.*.approver_user_id' => 'nullable|uuid',
            'steps.*.condition_expression' => 'nullable|array',
            'steps.*.is_optional' => 'boolean',
            'steps.*.sla_hours' => 'nullable|integer|min:1',
            'steps.*.on_timeout' => 'string|in:escalate,auto_approve,auto_reject',
        ]);

        try {
            $definition = DB::transaction(function () use ($validated) {
                $def = $this->definitionRepo->create([
                    'name' => $validated['name'],
                    'module' => $validated['module'],
                    'entity_type' => $validated['entity_type'],
                    'description' => $validated['description'] ?? null,
                    'is_active' => $validated['is_active'] ?? true,
                ]);

                foreach ($validated['steps'] as $stepData) {
                    $this->stepRepo->create(array_merge($stepData, [
                        'workflow_definition_id' => $def->id,
                    ]));
                }

                return $def->load('steps');
            });

            return $this->createdResponse(
                $definition,
                'Definisi alur kerja berhasil dibuat.'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('workflow.definitions.read');

        $definition = $this->definitionRepo->findOrFail($id);
        $definition->load('steps');

        return $this->successResponse(
            $definition,
            'Definisi alur kerja berhasil diambil.'
        );
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('workflow.definitions.update');

        $definition = $this->definitionRepo->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'module' => 'required|string|max:50',
            'entity_type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'steps' => 'required|array|min:1',
            'steps.*.id' => 'nullable|uuid',
            'steps.*.step_order' => 'required|integer|min:1',
            'steps.*.name' => 'required|string|max:255',
            'steps.*.approver_type' => 'required|string|in:role,specific_user,reports_to,department_head',
            'steps.*.approver_role_id' => 'nullable|uuid',
            'steps.*.approver_user_id' => 'nullable|uuid',
            'steps.*.condition_expression' => 'nullable|array',
            'steps.*.is_optional' => 'boolean',
            'steps.*.sla_hours' => 'nullable|integer|min:1',
            'steps.*.on_timeout' => 'string|in:escalate,auto_approve,auto_reject',
        ]);

        try {
            $updated = DB::transaction(function () use ($definition, $validated) {
                $definition->update([
                    'name' => $validated['name'],
                    'module' => $validated['module'],
                    'entity_type' => $validated['entity_type'],
                    'description' => $validated['description'] ?? null,
                    'is_active' => $validated['is_active'] ?? true,
                ]);

                // Hapus steps lama yang tidak dikirim
                $incomingIds = collect($validated['steps'])->pluck('id')->filter()->toArray();
                $definition->steps()->whereNotIn('id', $incomingIds)->delete();

                // Upsert steps baru/update
                foreach ($validated['steps'] as $stepData) {
                    if (!empty($stepData['id'])) {
                        $this->stepRepo->update($stepData['id'], $stepData);
                    } else {
                        $this->stepRepo->create(array_merge($stepData, [
                            'workflow_definition_id' => $definition->id,
                        ]));
                    }
                }

                return $definition->load('steps');
            });

            return $this->successResponse(
                $updated,
                'Definisi alur kerja berhasil diperbarui.'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('workflow.definitions.delete');

        $this->definitionRepo->delete($id);

        return $this->successResponse(
            null,
            'Definisi alur kerja berhasil dihapus.'
        );
    }
}
