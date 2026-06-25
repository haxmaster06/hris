<?php

declare(strict_types=1);

namespace Modules\Workflow\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowDefinition extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Workflow\Database\Factories\WorkflowDefinitionFactory
    {
        return \Modules\Workflow\Database\Factories\WorkflowDefinitionFactory::new();
    }

    protected $fillable = [
        'name',
        'module',
        'entity_type',
        'description',
        'is_active',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'version' => 'integer',
    ];

    /**
     * Relasi ke langkah-langkah approval.
     */
    public function steps(): HasMany
    {
        return $this->hasMany(WorkflowStep::class, 'workflow_definition_id')->orderBy('step_order');
    }

    /**
     * Relasi ke instance alur persetujuan berjalan.
     */
    public function instances(): HasMany
    {
        return $this->hasMany(WorkflowInstance::class, 'workflow_definition_id');
    }
}
