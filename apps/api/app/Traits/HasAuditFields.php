<?php

namespace App\Traits;

trait HasAuditFields
{
    protected static function bootHasAuditFields(): void
    {
        static::created(function ($model) {
            if (class_exists('Modules\Audit\Entities\AuditLog')) {
                \Modules\Audit\Entities\AuditLog::log('CREATE', $model);
            }
        });

        static::updated(function ($model) {
            if (class_exists('Modules\Audit\Entities\AuditLog')) {
                \Modules\Audit\Entities\AuditLog::log('UPDATE', $model, $model->getOriginal());
            }
        });

        static::deleted(function ($model) {
            if (class_exists('Modules\Audit\Entities\AuditLog')) {
                \Modules\Audit\Entities\AuditLog::log('DELETE', $model);
            }
        });
    }
}
