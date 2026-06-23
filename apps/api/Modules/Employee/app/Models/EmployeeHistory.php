<?php

declare(strict_types=1);

namespace Modules\Employee\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeHistory extends BaseModel
{
    use HasFactory;

    protected $table = 'employee_histories';

    protected static function newFactory(): \Modules\Employee\Database\Factories\EmployeeHistoryFactory
    {
        return \Modules\Employee\Database\Factories\EmployeeHistoryFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'type',
        'field',
        'old_value',
        'new_value',
        'effective_date',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'version' => 'integer',
    ];

    /**
     * Get the employee that owns the history log.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
