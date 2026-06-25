<?php

declare(strict_types=1);

namespace Modules\Compensation\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class Claim extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Compensation\Database\Factories\ClaimFactory
    {
        return \Modules\Compensation\Database\Factories\ClaimFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'claim_number',
        'type', // medical, reimbursement, travel, other
        'amount',
        'approved_amount',
        'claim_date',
        'description',
        'receipt_path',
        'status', // submitted, under_review, approved, rejected, paid
        'approved_by',
        'approved_at',
        'rejection_reason',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'claim_date' => 'date',
        'approved_at' => 'datetime',
        'version' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
