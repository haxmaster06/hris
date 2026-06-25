<?php

declare(strict_types=1);

namespace Modules\Attendance\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class OvertimeRequest extends BaseModel
{
    use HasFactory;

    protected $table = 'overtime_requests';

    protected static function newFactory(): \Modules\Attendance\Database\Factories\OvertimeRequestFactory
    {
        return \Modules\Attendance\Database\Factories\OvertimeRequestFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'date',
        'planned_hours',
        'actual_hours',
        'reason',
        'status',
        'approved_by',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'date' => 'date',
        'planned_hours' => 'decimal:2',
        'actual_hours' => 'decimal:2',
        'version' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'approved_by');
    }
}
