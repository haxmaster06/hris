<?php

declare(strict_types=1);

namespace Modules\Workflow\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use App\Models\User;

class WorkflowInstance extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Workflow\Database\Factories\WorkflowInstanceFactory
    {
        return \Modules\Workflow\Database\Factories\WorkflowInstanceFactory::new();
    }

    protected $fillable = [
        'workflow_definition_id',
        'entity_type',
        'entity_id',
        'current_step_order',
        'status', // in_progress, approved, rejected, cancelled, returned
        'initiated_by',
        'completed_at',
    ];

    protected $casts = [
        'current_step_order' => 'integer',
        'completed_at' => 'datetime',
    ];

    /**
     * Relasi ke definisi workflow utama.
     */
    public function definition(): BelongsTo
    {
        return $this->belongsTo(WorkflowDefinition::class, 'workflow_definition_id');
    }

    /**
     * Relasi polymorphic ke dokumen transaksi target (LeaveRequest, Claim, dll).
     */
    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Relasi ke riwayat tindakan peninjau.
     */
    public function actions(): HasMany
    {
        return $this->hasMany(WorkflowAction::class, 'workflow_instance_id')->orderBy('step_order');
    }

    /**
     * Relasi ke inisiator pengaju alur approval.
     */
    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }
}
