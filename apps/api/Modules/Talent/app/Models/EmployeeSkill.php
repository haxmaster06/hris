<?php

declare(strict_types=1);

namespace Modules\Talent\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class EmployeeSkill extends BaseModel
{
    use HasFactory;

    protected $table = 'employee_skills';

    protected static function newFactory(): \Modules\Talent\Database\Factories\EmployeeSkillFactory
    {
        return \Modules\Talent\Database\Factories\EmployeeSkillFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'skill_id',
        'proficiency_level',
        'assessed_at',
        'assessed_by',
        'notes',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'proficiency_level' => 'integer',
        'assessed_at' => 'date',
        'version' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class, 'skill_id');
    }

    public function assessor(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assessed_by');
    }
}
