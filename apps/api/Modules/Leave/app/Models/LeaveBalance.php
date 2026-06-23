<?php

declare(strict_types=1);

namespace Modules\Leave\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class LeaveBalance extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Leave\Database\Factories\LeaveBalanceFactory
    {
        return \Modules\Leave\Database\Factories\LeaveBalanceFactory::new();
    }
    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'year',
        'entitled',
        'used',
        'pending',
        'remaining',
    ];

    protected $casts = [
        'year' => 'integer',
        'entitled' => 'integer',
        'used' => 'integer',
        'pending' => 'integer',
        'remaining' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }
}
