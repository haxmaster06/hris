<?php

declare(strict_types=1);

namespace Modules\Recruitment\Models;

use App\Models\BaseModel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HiringApproval extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Recruitment\Database\Factories\HiringApprovalFactory
    {
        return \Modules\Recruitment\Database\Factories\HiringApprovalFactory::new();
    }

    protected $fillable = [
        'job_application_id',
        'approver_id',
        'stage',
        'status',
        'comments',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class, 'job_application_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
