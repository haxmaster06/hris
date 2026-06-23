<?php

declare(strict_types=1);

namespace Modules\Attendance\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class EmployeeShift extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Attendance\Database\Factories\EmployeeShiftFactory
    {
        return \Modules\Attendance\Database\Factories\EmployeeShiftFactory::new();
    }
    protected $fillable = [
        'employee_id',
        'shift_id',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }
}
