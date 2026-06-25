<?php

declare(strict_types=1);

namespace Modules\Disciplinary\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\Employee\Models\Employee;

class DisciplinaryCase extends BaseModel
{
    use HasFactory;

    protected $table = 'disciplinary_cases';

    protected static function newFactory(): \Modules\Disciplinary\Database\Factories\DisciplinaryCaseFactory
    {
        return \Modules\Disciplinary\Database\Factories\DisciplinaryCaseFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'case_number',
        'category',
        'incident_date',
        'description',
        'evidence',
        'severity',
        'status',
        'reported_by',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'incident_date' => 'date',
        'evidence' => 'array',
        'version' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'reported_by');
    }

    public function investigation(): HasOne
    {
        return $this->hasOne(Investigation::class, 'disciplinary_case_id');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(DisciplinaryAction::class, 'disciplinary_case_id');
    }
}
