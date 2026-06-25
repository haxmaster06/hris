<?php

declare(strict_types=1);

namespace Modules\Workflow\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowStep extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Workflow\Database\Factories\WorkflowStepFactory
    {
        return \Modules\Workflow\Database\Factories\WorkflowStepFactory::new();
    }

    protected static function booted(): void
    {
        // Nonaktifkan default event listener BaseModel (version, created_by, dll)
    }

    protected static function bootHasAuditFields(): void
    {
        // Nonaktifkan audit trail logging untuk model ini
    }

    // Karena tabel workflow_steps tidak memakai soft deletes di schema migration,
    // kita set model ini tidak memakai soft deletes bawaan BaseModel (jika BaseModel memakai soft deletes).
    // Tapi BaseModel biasanya menggunakan soft deletes. Karena tabel workflow_steps tidak memiliki deleted_at,
    // mari pastikan kita matikan soft deletes jika BaseModel mewajibkannya, atau kita biarkan Eloquent mendeteksinya.
    // Di Laravel, soft deletes diaktifkan via trait SoftDeletes. Mari kita cek jika BaseModel menggunakan trait SoftDeletes.
    // Jika BaseModel menggunakannya, kita dapat meng-override atau membiarkannya. Namun, karena migrasi tidak memiliki softDeletes() untuk workflow_steps,
    // lebih aman jika kita pastikan model ini tidak menggunakan soft deletes dengan tidak menyertakan trait, tetapi jika BaseModel menggunakannya,
    // model turunan akan mewarisinya. Mari kita buat model WorkflowStep biasa yang extends BaseModel.
    // Oh, tunggu! Di migrasi workflow_steps tidak ada softDeletes(). Jika BaseModel menggunakan SoftDeletes, maka query ke workflow_steps akan error karena mencari kolom `deleted_at`.
    // Mari kita cek isi BaseModel.php terlebih dahulu untuk melihat apakah ia memakai SoftDeletes secara default.
    // Kita bisa cari BaseModel.php dengan view_file.

    protected $fillable = [
        'workflow_definition_id',
        'step_order',
        'name',
        'approver_type',
        'approver_role_id',
        'approver_user_id',
        'condition_expression',
        'is_optional',
        'sla_hours',
        'on_timeout',
    ];

    protected $casts = [
        'step_order' => 'integer',
        'condition_expression' => 'array',
        'is_optional' => 'boolean',
        'sla_hours' => 'integer',
    ];

    /**
     * Relasi ke definisi workflow utama.
     */
    public function definition(): BelongsTo
    {
        return $this->belongsTo(WorkflowDefinition::class, 'workflow_definition_id');
    }
}
