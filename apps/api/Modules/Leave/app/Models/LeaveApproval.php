<?php

declare(strict_types=1);

namespace Modules\Leave\Models;

use App\Models\BaseModel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveApproval extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Leave\Database\Factories\LeaveApprovalFactory
    {
        return \Modules\Leave\Database\Factories\LeaveApprovalFactory::new();
    }
    protected $fillable = [
        'leave_request_id',
        'approver_id',
        'status',
        'comments',
    ];

    public function leaveRequest(): BelongsTo
    {
        return $this->belongsTo(LeaveRequest::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
