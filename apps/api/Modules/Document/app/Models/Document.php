<?php

declare(strict_types=1);

namespace Modules\Document\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class Document extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'document_category_id',
        'file_name',
        'original_name',
        'mime_type',
        'file_size',
        'storage_provider',
        'storage_path',
        'expiry_date',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'file_size' => 'integer',
    ];

    protected static function newFactory(): \Modules\Document\Database\Factories\DocumentFactory
    {
        return \Modules\Document\Database\Factories\DocumentFactory::new();
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(DocumentCategory::class, 'document_category_id');
    }
}
