<?php

declare(strict_types=1);

namespace Modules\Organization\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Grade extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Organization\Database\Factories\GradeFactory
    {
        return \Modules\Organization\Database\Factories\GradeFactory::new();
    }
    protected $fillable = [
        'name',
        'code',
        'level',
        'min_salary',
        'max_salary',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'level' => 'integer',
        'min_salary' => 'decimal:2',
        'max_salary' => 'decimal:2',
        'version' => 'integer',
    ];
}
