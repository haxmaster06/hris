<?php

declare(strict_types=1);

namespace Modules\Compensation\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BonusScheme extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Compensation\Database\Factories\BonusSchemeFactory
    {
        return \Modules\Compensation\Database\Factories\BonusSchemeFactory::new();
    }

    protected $fillable = [
        'name',
        'type', // performance, annual, project, referral, other
        'calculation_type', // percentage, fixed_amount
        'value',
        'description',
        'is_active',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'is_active' => 'boolean',
        'version' => 'integer',
    ];
}
