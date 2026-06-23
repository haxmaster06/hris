<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\HasAuditFields;

abstract class BaseModel extends Model
{
    use HasUuids, SoftDeletes, HasAuditFields;

    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * Generate UUID v7 for the model primary key.
     */
    public function newUniqueId(): string
    {
        return (string) \Illuminate\Support\Str::orderedUuid();
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (auth()->check()) {
                $model->created_by = $model->created_by ?? auth()->id();
            }
        });

        static::updating(function ($model) {
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
            $model->version = ($model->version ?? 1) + 1;
        });

        static::deleting(function ($model) {
            if (auth()->check()) {
                $model->deleted_by = auth()->id();
                $model->saveQuietly();
            }
        });
    }
}
