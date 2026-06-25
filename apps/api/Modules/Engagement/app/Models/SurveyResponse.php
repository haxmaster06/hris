<?php

declare(strict_types=1);

namespace Modules\Engagement\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Employee\Models\Employee;

class SurveyResponse extends BaseModel
{
    use HasFactory;

    protected $table = 'survey_responses';

    protected static function newFactory(): \Modules\Engagement\Database\Factories\SurveyResponseFactory
    {
        return \Modules\Engagement\Database\Factories\SurveyResponseFactory::new();
    }

    protected $fillable = [
        'survey_id',
        'employee_id',
        'submitted_at',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'version' => 'integer',
    ];

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class, 'survey_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(SurveyAnswer::class, 'survey_response_id');
    }
}
