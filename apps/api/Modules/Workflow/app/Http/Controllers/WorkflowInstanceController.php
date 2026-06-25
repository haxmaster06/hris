<?php

declare(strict_types=1);

namespace Modules\Workflow\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Workflow\Repositories\WorkflowInstanceRepositoryInterface;
use Modules\Workflow\Services\WorkflowEngine;
use Exception;

class WorkflowInstanceController extends BaseController
{
    public function __construct(
        private readonly WorkflowInstanceRepositoryInterface $instanceRepo,
        private readonly WorkflowEngine $workflowEngine
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('workflow.instances.read');

        $user = auth()->user();
        $filters = $request->all();

        // Inbox mode: filter by current pending approver (user or user's roles)
        if ($request->boolean('inbox')) {
            $filters['pending_approver_user_id'] = $user->id;
            // Dapatkan role ids Spatie
            $filters['pending_approver_role_ids'] = $user->roles->pluck('id')->toArray();
        }

        $instances = $this->instanceRepo->paginate($filters);

        // Pasca-filter untuk model custom logic (reports_to, department_head) di codebase PHP level
        // karena reports_to dan department_head dinilai dinamis berdasarkan relasi karyawan.
        if ($request->boolean('inbox') && $instances->count() > 0) {
            $items = $instances->getCollection();
            $filteredItems = $items->filter(function ($instance) use ($user) {
                // Cari step aktif saat ini
                $step = $instance->definition->steps
                    ->where('step_order', $instance->current_step_order)
                    ->first();

                if (!$step) {
                    return false;
                }

                // Cek otorisasi lewat engine
                return $this->workflowEngine->isActorAuthorized($step, $user, $instance);
            });

            // Set kembali collection yang ter-filter
            $instances->setCollection($filteredItems->values());
        }

        return $this->successResponse(
            $instances,
            'Workflow instances retrieved successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('workflow.instances.read');

        $instance = $this->instanceRepo->findOrFail($id);
        
        // Eager load data terkait
        $instance->load([
            'definition.steps',
            'initiator',
            'actions.actor'
        ]);

        // Muat entity target secara dinamis
        $entityClass = $instance->entity_type;
        $entity = $entityClass::find($instance->entity_id);
        
        $data = $instance->toArray();
        $data['entity'] = $entity;

        return $this->successResponse(
            $data,
            'Workflow instance retrieved successfully'
        );
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        Gate::authorize('workflow.instances.approve');

        $instance = $this->instanceRepo->findOrFail($id);
        $user = auth()->user();

        $validated = $request->validate([
            'comment' => 'nullable|string|max:1000',
        ]);

        try {
            $updatedInstance = $this->workflowEngine->approve(
                $instance,
                $user,
                $validated['comment'] ?? null
            );

            return $this->successResponse(
                $updatedInstance,
                'Dokumen berhasil disetujui.'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        Gate::authorize('workflow.instances.approve');

        $instance = $this->instanceRepo->findOrFail($id);
        $user = auth()->user();

        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        try {
            $updatedInstance = $this->workflowEngine->reject(
                $instance,
                $user,
                $validated['reason']
            );

            return $this->successResponse(
                $updatedInstance,
                'Dokumen berhasil ditolak.'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function return(Request $request, string $id): JsonResponse
    {
        Gate::authorize('workflow.instances.approve');

        $instance = $this->instanceRepo->findOrFail($id);
        $user = auth()->user();

        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        try {
            $updatedInstance = $this->workflowEngine->return(
                $instance,
                $user,
                $validated['reason']
            );

            return $this->successResponse(
                $updatedInstance,
                'Dokumen berhasil dikembalikan ke pemohon untuk direvisi.'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
