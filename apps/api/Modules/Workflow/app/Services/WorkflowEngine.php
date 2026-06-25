<?php

declare(strict_types=1);

namespace Modules\Workflow\Services;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use Modules\Workflow\Models\WorkflowDefinition;
use Modules\Workflow\Models\WorkflowInstance;
use Modules\Workflow\Models\WorkflowStep;
use Modules\Workflow\Repositories\WorkflowInstanceRepositoryInterface;
use Modules\Workflow\Repositories\WorkflowActionRepositoryInterface;
use Modules\Workflow\Repositories\WorkflowStepRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Exception;

class WorkflowEngine
{
    public function __construct(
        private readonly WorkflowInstanceRepositoryInterface $instanceRepo,
        private readonly WorkflowActionRepositoryInterface $actionRepo,
        private readonly WorkflowStepRepositoryInterface $stepRepo
    ) {}

    /**
     * Memulai alur persetujuan untuk entity tertentu.
     */
    public function initiate(WorkflowDefinition $def, Model $entity, User $initiator): WorkflowInstance
    {
        return DB::transaction(function () use ($def, $entity, $initiator) {
            // Cek apakah sudah ada instance aktif untuk entity ini
            $activeInstance = $this->instanceRepo->findActiveForEntity(get_class($entity), (string) $entity->getKey());
            if ($activeInstance) {
                throw new Exception('Alur persetujuan untuk dokumen ini sedang berjalan.');
            }

            // Buat instance baru
            $instance = $this->instanceRepo->create([
                'workflow_definition_id' => $def->id,
                'entity_type' => get_class($entity),
                'entity_id' => $entity->getKey(),
                'current_step_order' => 1,
                'status' => 'in_progress',
                'initiated_by' => $initiator->id,
            ]);

            // Cari langkah pertama yang memenuhi kondisi
            $this->moveToStep($instance, 1, $entity);

            return $instance->fresh();
        });
    }

    /**
     * Menyetujui langkah saat ini dan lanjut ke langkah berikutnya.
     */
    public function approve(WorkflowInstance $instance, User $actor, ?string $comment = null): WorkflowInstance
    {
        return DB::transaction(function () use ($instance, $actor, $comment) {
            if ($instance->status !== 'in_progress') {
                throw new Exception('Alur persetujuan ini sudah selesai atau tidak aktif.');
            }

            // Dapatkan langkah saat ini
            $step = $this->stepRepo->findByDefinitionAndOrder($instance->workflow_definition_id, $instance->current_step_order);
            if (!$step) {
                throw new Exception('Langkah persetujuan saat ini tidak ditemukan.');
            }

            // Validasi authorisasi aktor
            if (!$this->isActorAuthorized($step, $actor, $instance)) {
                throw new Exception('Anda tidak memiliki otoritas untuk menyetujui langkah ini.');
            }

            // Catat aksi approval
            $this->actionRepo->create([
                'workflow_instance_id' => $instance->id,
                'workflow_step_id' => $step->id,
                'step_order' => $step->step_order,
                'actor_id' => $actor->id,
                'action' => 'approve',
                'comment' => $comment,
                'acted_at' => now(),
            ]);

            // Pindah ke langkah berikutnya
            $nextOrder = $step->step_order + 1;
            $entity = $instance->entity_type::find($instance->entity_id);
            if (!$entity) {
                throw new Exception('Dokumen yang diajukan tidak ditemukan.');
            }

            $this->moveToStep($instance, $nextOrder, $entity);

            return $instance->fresh();
        });
    }

    /**
     * Menolak alur persetujuan secara permanen.
     */
    public function reject(WorkflowInstance $instance, User $actor, string $reason): WorkflowInstance
    {
        return DB::transaction(function () use ($instance, $actor, $reason) {
            if ($instance->status !== 'in_progress') {
                throw new Exception('Alur persetujuan ini sudah selesai atau tidak aktif.');
            }

            $step = $this->stepRepo->findByDefinitionAndOrder($instance->workflow_definition_id, $instance->current_step_order);
            if (!$step) {
                throw new Exception('Langkah persetujuan saat ini tidak ditemukan.');
            }

            if (!$this->isActorAuthorized($step, $actor, $instance)) {
                throw new Exception('Anda tidak memiliki otoritas untuk menolak langkah ini.');
            }

            // Catat aksi reject
            $this->actionRepo->create([
                'workflow_instance_id' => $instance->id,
                'workflow_step_id' => $step->id,
                'step_order' => $step->step_order,
                'actor_id' => $actor->id,
                'action' => 'reject',
                'comment' => $reason,
                'acted_at' => now(),
            ]);

            // Update instance
            $instance->update([
                'status' => 'rejected',
                'completed_at' => now(),
            ]);

            // Update status entity
            $entity = $instance->entity_type::find($instance->entity_id);
            if ($entity) {
                $this->updateEntityStatus($entity, 'rejected', $reason);
            }

            return $instance->fresh();
        });
    }

    /**
     * Mengembalikan dokumen ke pemohon untuk direvisi.
     */
    public function return(WorkflowInstance $instance, User $actor, string $reason): WorkflowInstance
    {
        return DB::transaction(function () use ($instance, $actor, $reason) {
            if ($instance->status !== 'in_progress') {
                throw new Exception('Alur persetujuan ini sudah selesai atau tidak aktif.');
            }

            $step = $this->stepRepo->findByDefinitionAndOrder($instance->workflow_definition_id, $instance->current_step_order);
            if (!$step) {
                throw new Exception('Langkah persetujuan saat ini tidak ditemukan.');
            }

            if (!$this->isActorAuthorized($step, $actor, $instance)) {
                throw new Exception('Anda tidak memiliki otoritas untuk mengembalikan langkah ini.');
            }

            // Catat aksi return
            $this->actionRepo->create([
                'workflow_instance_id' => $instance->id,
                'workflow_step_id' => $step->id,
                'step_order' => $step->step_order,
                'actor_id' => $actor->id,
                'action' => 'return',
                'comment' => $reason,
                'acted_at' => now(),
            ]);

            // Update instance
            $instance->update([
                'status' => 'returned',
                'completed_at' => now(),
            ]);

            // Update status entity
            $entity = $instance->entity_type::find($instance->entity_id);
            if ($entity) {
                $this->updateEntityStatus($entity, 'returned', $reason);
            }

            return $instance->fresh();
        });
    }

    /**
     * Memproses pergerakan langkah persetujuan (lewati opsional/kondisional jika tidak memenuhi).
     */
    private function moveToStep(WorkflowInstance $instance, int $stepOrder, Model $entity): void
    {
        $nextStep = $this->stepRepo->findByDefinitionAndOrder($instance->workflow_definition_id, $stepOrder);

        if (!$nextStep) {
            // Semua langkah persetujuan telah dilalui dan disetujui
            $instance->update([
                'status' => 'approved',
                'completed_at' => now(),
            ]);

            $this->updateEntityStatus($entity, 'approved');
            return;
        }

        // Cek evaluasi condition expression
        $conditionMet = $this->evaluateCondition($entity, $nextStep->condition_expression);

        if (!$conditionMet) {
            // Jika kondisi tidak terpenuhi, dan step opsional atau bisa dilompati, maju ke step berikutnya
            $this->moveToStep($instance, $stepOrder + 1, $entity);
            return;
        }

        // Update step aktif saat ini di instance
        $instance->update([
            'current_step_order' => $stepOrder,
        ]);
    }

    /**
     * Memeriksa apakah aktor berhak mengeksekusi langkah persetujuan tertentu.
     */
    public function isActorAuthorized(WorkflowStep $step, User $actor, WorkflowInstance $instance): bool
    {
        switch ($step->approver_type) {
            case 'specific_user':
                return $step->approver_user_id === $actor->id;

            case 'role':
                if ($step->approver_role_id) {
                    $roleName = DB::table('roles')->where('id', $step->approver_role_id)->value('name');
                    return $roleName ? $actor->hasRole($roleName) : false;
                }
                return false;

            case 'reports_to':
                $initiatorId = $instance->initiated_by;
                $employee = DB::table('employees')->where('user_id', $initiatorId)->first();
                if ($employee && $employee->reports_to) {
                    $supervisor = DB::table('employees')->where('id', $employee->reports_to)->first();
                    return $supervisor && $supervisor->user_id === $actor->id;
                }
                return false;

            case 'department_head':
                $initiatorId = $instance->initiated_by;
                $employee = DB::table('employees')->where('user_id', $initiatorId)->first();
                if ($employee && $employee->department_id) {
                    // Cari employee dengan jabatan Head/Manager/Kepala di departemen yang sama
                    $manager = DB::table('employees')
                        ->join('positions', 'employees.position_id', '=', 'positions.id')
                        ->where('employees.department_id', $employee->department_id)
                        ->whereNull('employees.deleted_at')
                        ->where(function ($q) {
                            $q->where('positions.name', 'like', '%Head%')
                              ->orWhere('positions.name', 'like', '%Manager%')
                              ->orWhere('positions.name', 'like', '%Kepala%');
                        })
                        ->select('employees.user_id')
                        ->first();

                    if ($manager) {
                        return $manager->user_id === $actor->id;
                    }

                    // Fallback ke reports_to jika kepala departemen tidak terdefinisi
                    if ($employee->reports_to) {
                        $supervisor = DB::table('employees')->where('id', $employee->reports_to)->first();
                        return $supervisor && $supervisor->user_id === $actor->id;
                    }
                }
                return false;
        }

        return false;
    }

    /**
     * Mengevaluasi kondisi JSON expression terhadap field entity.
     */
    private function evaluateCondition(Model $entity, ?array $expression): bool
    {
        if (empty($expression)) {
            return true;
        }

        $rules = isset($expression['field']) ? [$expression] : $expression;

        foreach ($rules as $rule) {
            $field = $rule['field'] ?? null;
            $operator = $rule['operator'] ?? '==';
            $expected = $rule['value'] ?? null;

            if (!$field) {
                continue;
            }

            $actual = $entity->getAttribute($field);

            switch ($operator) {
                case '==':
                    if ($actual != $expected) return false;
                    break;
                case '!=':
                    if ($actual == $expected) return false;
                    break;
                case '>':
                    if ($actual <= $expected) return false;
                    break;
                case '<':
                    if ($actual >= $expected) return false;
                    break;
                case '>=':
                    if ($actual < $expected) return false;
                    break;
                case '<=':
                    if ($actual > $expected) return false;
                    break;
            }
        }

        return true;
    }

    /**
     * Memperbarui status model target secara dinamis menggunakan hook method atau direct column update.
     */
    private function updateEntityStatus(Model $entity, string $status, ?string $reason = null): void
    {
        $hookMethod = match ($status) {
            'approved' => 'onWorkflowApproved',
            'rejected' => 'onWorkflowRejected',
            'returned' => 'onWorkflowReturned',
            default => null,
        };

        if ($hookMethod && method_exists($entity, $hookMethod)) {
            $entity->{$hookMethod}($reason);
        } else {
            if (in_array('status', $entity->getFillable()) || isset($entity->status)) {
                $entity->status = match ($status) {
                    'approved' => 'approved',
                    'rejected' => 'rejected',
                    'returned' => 'returned',
                    default => $status,
                };
                $entity->save();
            }
        }
    }
}
