<?php

declare(strict_types=1);

namespace Modules\Recruitment\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobApplication extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Recruitment\Database\Factories\JobApplicationFactory
    {
        return \Modules\Recruitment\Database\Factories\JobApplicationFactory::new();
    }

    protected $fillable = [
        'vacancy_id',
        'candidate_id',
        'status',
        'applied_date',
    ];

    protected $casts = [
        'applied_date' => 'date',
    ];

    public function vacancy(): BelongsTo
    {
        return $this->belongsTo(Vacancy::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function interviews(): HasMany
    {
        return $this->hasMany(Interview::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(HiringApproval::class);
    }
}
