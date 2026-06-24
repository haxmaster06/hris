<?php

declare(strict_types=1);

namespace Modules\Recruitment\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidate extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Recruitment\Database\Factories\CandidateFactory
    {
        return \Modules\Recruitment\Database\Factories\CandidateFactory::new();
    }

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'resume_path',
    ];

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }
}
