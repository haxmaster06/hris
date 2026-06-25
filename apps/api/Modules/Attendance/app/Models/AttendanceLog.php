<?php

declare(strict_types=1);

namespace Modules\Attendance\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class AttendanceLog extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Attendance\Database\Factories\AttendanceLogFactory
    {
        return \Modules\Attendance\Database\Factories\AttendanceLogFactory::new();
    }
    protected $fillable = [
        'employee_id',
        'date',
        'check_in',
        'check_out',
        'check_in_ip',
        'check_out_ip',
        'status',
        'work_hours',
        'latitude',
        'longitude',
        'accuracy',
        'check_in_address',
        'check_out_address',
    ];

    protected $casts = [
        'date' => 'date',
        'work_hours' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'accuracy' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
