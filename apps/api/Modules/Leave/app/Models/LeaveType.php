<?php

declare(strict_types=1);

namespace Modules\Leave\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveType extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Leave\Database\Factories\LeaveTypeFactory
    {
        return \Modules\Leave\Database\Factories\LeaveTypeFactory::new();
    }
    protected $fillable = [
        'name',
        'code',
        'default_days',
        'is_paid',
    ];

    protected $casts = [
        'default_days' => 'integer',
        'is_paid' => 'boolean',
    ];

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }
}
