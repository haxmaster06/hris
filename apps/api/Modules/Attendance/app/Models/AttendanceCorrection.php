<?php

declare(strict_types=1);

namespace Modules\Attendance\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class AttendanceCorrection extends BaseModel
{
    use HasFactory;

    protected $table = 'attendance_corrections';

    protected static function newFactory(): \Modules\Attendance\Database\Factories\AttendanceCorrectionFactory
    {
        return \Modules\Attendance\Database\Factories\AttendanceCorrectionFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'original_check_in',
        'original_check_out',
        'corrected_check_in',
        'corrected_check_out',
        'reason',
        'status',
        'approved_by',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'original_check_in' => 'datetime',
        'original_check_out' => 'datetime',
        'corrected_check_in' => 'datetime',
        'corrected_check_out' => 'datetime',
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
