<?php

declare(strict_types=1);

namespace Modules\Recruitment\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Organization\Models\Company;
use Modules\Organization\Models\Branch;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Position;

class Vacancy extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Recruitment\Database\Factories\VacancyFactory
    {
        return \Modules\Recruitment\Database\Factories\VacancyFactory::new();
    }

    protected $fillable = [
        'company_id',
        'branch_id',
        'department_id',
        'position_id',
        'title',
        'description',
        'requirements',
        'slots',
        'status',
    ];

    protected $casts = [
        'slots' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }
}
