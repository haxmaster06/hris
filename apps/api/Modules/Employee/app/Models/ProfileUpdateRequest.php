<?php

declare(strict_types=1);

namespace Modules\Employee\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfileUpdateRequest extends BaseModel
{
    use HasFactory;

    protected $table = 'profile_update_requests';

    protected static function newFactory(): \Modules\Employee\Database\Factories\ProfileUpdateRequestFactory
    {
        return \Modules\Employee\Database\Factories\ProfileUpdateRequestFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'field_name',
        'old_value',
        'new_value',
        'status',
        'approved_by',
        'comments',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
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
