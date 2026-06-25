<?php

declare(strict_types=1);

namespace Modules\Audit\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use App\Models\User;

class AuditLog extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Audit\Database\Factories\AuditLogFactory
    {
        return \Modules\Audit\Database\Factories\AuditLogFactory::new();
    }

    protected static function booted(): void
    {
        // Nonaktifkan default event listener BaseModel (version, created_by, dll)
    }

    protected static function bootHasAuditFields(): void
    {
        // Nonaktifkan audit trail logging untuk model ini
    }

    // Tabel audit_logs hanya memiliki created_at dan deleted_at (soft deletes), tanpa updated_at
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'user_name',
        'action', // created, updated, deleted, restored, force_deleted
        'auditable_type',
        'auditable_id',
        'auditable_label',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'module',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    /**
     * Relasi ke pelaku (aktor) perubahan data.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relasi polymorphic ke model target yang mengalami perubahan.
     */
    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }
}
