<?php

declare(strict_types=1);

namespace Modules\Engagement\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class Award extends BaseModel
{
    use HasFactory;

    protected $table = 'awards';

    protected static function newFactory(): \Modules\Engagement\Database\Factories\AwardFactory
    {
        return \Modules\Engagement\Database\Factories\AwardFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'title',
        'description',
        'category',
        'awarded_date',
        'awarded_by',
        'certificate_path',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'awarded_date' => 'date',
        'version' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function awarder(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'awarded_by');
    }
}
