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

    /**
     * Carry forward remaining leave balances from previous year to target year.
     * Roll over maximum 5 days.
     */
    public static function carryForward(int $year): void
    {
        $previousBalances = self::where('year', $year - 1)->get();

        foreach ($previousBalances as $prev) {
            $carried = min($prev->remaining, 5);
            if ($carried <= 0) {
                continue;
            }

            $newBalance = self::firstOrNew([
                'employee_id' => $prev->employee_id,
                'leave_type_id' => $prev->leave_type_id,
                'year' => $year,
            ]);

            if (!$newBalance->exists) {
                $newBalance->entitled = $prev->leaveType ? ($prev->leaveType->default_days ?? 12) : 12;
                $newBalance->used = 0;
                $newBalance->pending = 0;
            }

            $newBalance->entitled += $carried;
            $newBalance->remaining = $newBalance->entitled - $newBalance->used - $newBalance->pending;
            $newBalance->save();
        }
    }
}
