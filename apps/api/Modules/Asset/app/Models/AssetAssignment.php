<?php

declare(strict_types=1);

namespace Modules\Asset\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class AssetAssignment extends BaseModel
{
    use HasFactory;

    protected $table = 'asset_assignments';

    protected static function newFactory(): \Modules\Asset\Database\Factories\AssetAssignmentFactory
    {
        return \Modules\Asset\Database\Factories\AssetAssignmentFactory::new();
    }

    protected $fillable = [
        'asset_id',
        'employee_id',
        'assigned_date',
        'expected_return_date',
        'returned_date',
        'condition_on_assign',
        'condition_on_return',
        'assign_notes',
        'return_notes',
        'bast_document_path',
        'assigned_by',
        'received_by',
        'status',
        'version',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'expected_return_date' => 'date',
        'returned_date' => 'date',
        'version' => 'integer',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function assigner(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_by');
    }
}
