<?php

declare(strict_types=1);

namespace Modules\Audit\Observers;

use Illuminate\Database\Eloquent\Model;
use Modules\Audit\Repositories\AuditLogRepositoryInterface;

class AuditObserver
{
    private array $sensitiveFields = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
        'token',
        'api_token',
        'secret',
        'client_secret',
    ];

    public function __construct(
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {}

    public function created(Model $model): void
    {
        $this->logAction('created', $model);
    }

    public function updated(Model $model): void
    {
        $this->logAction('updated', $model);
    }

    public function deleted(Model $model): void
    {
        $this->logAction('deleted', $model);
    }

    public function restored(Model $model): void
    {
        $this->logAction('restored', $model);
    }

    private function logAction(string $action, Model $model): void
    {
        // Hindari logging model AuditLog sendiri untuk mencegah recursion/infinite loop
        if ($model instanceof \Modules\Audit\Models\AuditLog) {
            return;
        }

        $user = auth()->user();
        
        $oldValues = null;
        $newValues = null;

        if ($action === 'created') {
            $newValues = $this->filterSensitiveFields($model->getAttributes());
        } elseif ($action === 'updated') {
            // Bandingkan attribute saat ini dengan original
            $dirty = $model->getDirty();
            $old = [];
            $new = [];

            foreach ($dirty as $key => $value) {
                if (in_array($key, $this->sensitiveFields, true)) {
                    continue;
                }
                // Saring field timestamp bawaan jika tidak perlu dicatat perubahannya
                if (in_array($key, ['updated_at', 'created_at', 'deleted_at', 'version', 'updated_by'], true)) {
                    continue;
                }
                $old[$key] = $model->getOriginal($key);
                $new[$key] = $value;
            }

            if (empty($new)) {
                return; // Tidak ada perubahan yang berarti untuk dicatat
            }

            $oldValues = $old;
            $newValues = $new;
        } elseif ($action === 'deleted') {
            $oldValues = $this->filterSensitiveFields($model->getAttributes());
        }

        // Cari label representatif untuk model (e.g. name, title, code, number)
        $label = $this->getModelLabel($model);

        // Cari nama modul dari namespace model
        $module = $this->getModuleNameFromModel($model);

        $this->auditLogRepository->create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? $user?->username ?? 'System',
            'action' => $action,
            'auditable_type' => get_class($model),
            'auditable_id' => $model->getKey(),
            'auditable_label' => $label,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'module' => $module,
        ]);
    }

    private function filterSensitiveFields(array $attributes): array
    {
        return array_filter($attributes, function ($key) {
            return !in_array($key, $this->sensitiveFields, true) && 
                   !in_array($key, ['updated_at', 'created_at', 'deleted_at', 'version', 'updated_by', 'created_by', 'deleted_by'], true);
        }, ARRAY_FILTER_USE_KEY);
    }

    private function getModelLabel(Model $model): ?string
    {
        $labelAttributes = ['name', 'title', 'label', 'code', 'number', 'full_name', 'username', 'email'];
        foreach ($labelAttributes as $attr) {
            if (isset($model->{$attr})) {
                return (string) $model->{$attr};
            }
        }
        return (string) $model->getKey();
    }

    private function getModuleNameFromModel(Model $model): ?string
    {
        $className = get_class($model);
        if (str_starts_with($className, 'Modules\\')) {
            $parts = explode('\\', $className);
            return $parts[1]; // Index 1 adalah nama modul, misal: Leave
        }
        return 'Core';
    }
}
