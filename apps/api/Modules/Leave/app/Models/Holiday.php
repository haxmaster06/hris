<?php

declare(strict_types=1);

namespace Modules\Leave\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Holiday extends BaseModel
{
    use HasFactory;

    protected $table = 'holidays';

    protected static function newFactory(): \Modules\Leave\Database\Factories\HolidayFactory
    {
        return \Modules\Leave\Database\Factories\HolidayFactory::new();
    }

    protected $fillable = [
        'name',
        'date',
        'type',
        'is_recurring',
        'description',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'date' => 'date',
        'is_recurring' => 'boolean',
        'version' => 'integer',
    ];
}
