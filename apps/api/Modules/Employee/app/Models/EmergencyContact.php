<?php

declare(strict_types=1);

namespace Modules\Employee\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmergencyContact extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Employee\Database\Factories\EmergencyContactFactory
    {
        return \Modules\Employee\Database\Factories\EmergencyContactFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'name',
        'relationship',
        'phone',
        'email',
        'address',
        'is_primary',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'version' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
