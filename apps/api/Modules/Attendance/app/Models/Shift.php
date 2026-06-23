<?php

declare(strict_types=1);

namespace Modules\Attendance\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Attendance\Database\Factories\ShiftFactory
    {
        return \Modules\Attendance\Database\Factories\ShiftFactory::new();
    }
    protected $fillable = [
        'name',
        'code',
        'start_time',
        'end_time',
        'late_tolerance',
    ];

    protected $casts = [
        'late_tolerance' => 'integer',
    ];

    public function employeeShifts(): HasMany
    {
        return $this->hasMany(EmployeeShift::class);
    }
}
