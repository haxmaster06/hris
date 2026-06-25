<?php

declare(strict_types=1);

namespace Modules\Workflow\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class WorkflowAction extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Workflow\Database\Factories\WorkflowActionFactory
    {
        return \Modules\Workflow\Database\Factories\WorkflowActionFactory::new();
    }

    protected static function booted(): void
    {
        // Nonaktifkan default event listener BaseModel (version, created_by, dll)
    }

    protected static function bootHasAuditFields(): void
    {
        // Nonaktifkan audit trail logging untuk model ini
    }

    protected $fillable = [
        'workflow_instance_id',
        'workflow_step_id',
        'step_order',
        'actor_id',
        'action', // approve, reject, return, delegate
        'comment',
        'acted_at',
    ];

    protected $casts = [
        'step_order' => 'integer',
        'acted_at' => 'datetime',
    ];

    /**
     * Relasi ke instance alur persetujuan berjalan.
     */
    public function instance(): BelongsTo
    {
        return $this->belongsTo(WorkflowInstance::class, 'workflow_instance_id');
    }

    /**
     * Relasi ke langkah workflow yang ditindak.
     */
    public function step(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'workflow_step_id');
    }

    /**
     * Relasi ke peninjau (aktor) yang bertindak.
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
