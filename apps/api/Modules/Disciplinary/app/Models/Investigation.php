<?php

declare(strict_types=1);

namespace Modules\Disciplinary\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class Investigation extends BaseModel
{
    use HasFactory;

    protected $table = 'investigations';

    protected static function newFactory(): \Modules\Disciplinary\Database\Factories\InvestigationFactory
    {
        return \Modules\Disciplinary\Database\Factories\InvestigationFactory::new();
    }

    protected $fillable = [
        'disciplinary_case_id',
        'investigator_id',
        'findings',
        'recommendation',
        'committee_notes',
        'status',
        'completed_at',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
        'version' => 'integer',
    ];

    public function case(): BelongsTo
    {
        return $this->belongsTo(DisciplinaryCase::class, 'disciplinary_case_id');
    }

    public function investigator(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'investigator_id');
    }
}
