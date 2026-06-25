<?php

declare(strict_types=1);

namespace Modules\Document\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class DocumentVersion extends BaseModel
{
    use HasFactory;

    protected $table = 'document_versions';

    protected static function newFactory(): \Modules\Document\Database\Factories\DocumentVersionFactory
    {
        return \Modules\Document\Database\Factories\DocumentVersionFactory::new();
    }

    protected $fillable = [
        'document_id',
        'version_number',
        'file_path',
        'file_size',
        'uploaded_by',
        'notes',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'version_number' => 'integer',
        'file_size' => 'integer',
        'version' => 'integer',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'document_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'uploaded_by');
    }
}
