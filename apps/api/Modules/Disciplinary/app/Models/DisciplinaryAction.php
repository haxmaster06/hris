<?php

declare(strict_types=1);

namespace Modules\Disciplinary\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class DisciplinaryAction extends BaseModel
{
    use HasFactory;

    protected $table = 'disciplinary_actions';

    protected static function newFactory(): \Modules\Disciplinary\Database\Factories\DisciplinaryActionFactory
    {
        return \Modules\Disciplinary\Database\Factories\DisciplinaryActionFactory::new();
    }

    protected $fillable = [
        'disciplinary_case_id',
        'action_type',
        'effective_date',
        'expiry_date',
        'description',
        'issued_by',
        'document_path',
        'acknowledged_by',
        'acknowledged_at',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'expiry_date' => 'date',
        'acknowledged_at' => 'datetime',
        'version' => 'integer',
    ];

    public function case(): BelongsTo
    {
        return $this->belongsTo(DisciplinaryCase::class, 'disciplinary_case_id');
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'issued_by');
    }

    public function acknowledger(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'acknowledged_by');
    }
}
