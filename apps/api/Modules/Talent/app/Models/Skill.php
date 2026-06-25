<?php

declare(strict_types=1);

namespace Modules\Talent\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Skill extends BaseModel
{
    use HasFactory;

    protected $table = 'skills';

    protected static function newFactory(): \Modules\Talent\Database\Factories\SkillFactory
    {
        return \Modules\Talent\Database\Factories\SkillFactory::new();
    }

    protected $fillable = [
        'name',
        'category',
        'description',
        'is_active',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'version' => 'integer',
    ];

    public function employeeSkills(): HasMany
    {
        return $this->hasMany(EmployeeSkill::class, 'skill_id');
    }
}
