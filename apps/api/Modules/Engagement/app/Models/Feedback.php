<?php

declare(strict_types=1);

namespace Modules\Engagement\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class Feedback extends BaseModel
{
    use HasFactory;

    protected $table = 'feedbacks';

    protected static function newFactory(): \Modules\Engagement\Database\Factories\FeedbackFactory
    {
        return \Modules\Engagement\Database\Factories\FeedbackFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'type',
        'category',
        'content',
        'is_anonymous',
        'status',
        'response',
        'responded_by',
        'responded_at',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'is_anonymous' => 'boolean',
        'responded_at' => 'datetime',
        'version' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
