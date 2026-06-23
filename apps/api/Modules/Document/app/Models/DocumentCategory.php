<?php

declare(strict_types=1);

namespace Modules\Document\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DocumentCategory extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
    ];

    protected static function newFactory(): \Modules\Document\Database\Factories\DocumentCategoryFactory
    {
        return \Modules\Document\Database\Factories\DocumentCategoryFactory::new();
    }
}
