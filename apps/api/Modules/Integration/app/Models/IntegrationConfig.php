<?php

declare(strict_types=1);

namespace Modules\Integration\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Crypt;

class IntegrationConfig extends BaseModel
{
    use HasFactory;

    protected $table = 'integration_configs';

    protected $fillable = [
        'type',
        'provider',
        'name',
        'config',
        'is_active',
        'last_synced_at',
        'created_by',
        'updated_by',
        'deleted_by',
        'version',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'config' => 'array',
        'last_synced_at' => 'datetime',
        'version' => 'integer',
    ];

    // Encrypt configuration when saving, and decrypt when retrieving
    public function setConfigAttribute($value): void
    {
        $this->attributes['config'] = Crypt::encryptString(json_encode($value));
    }

    public function getConfigAttribute($value)
    {
        if (!$value) {
            return [];
        }

        try {
            return json_decode(Crypt::decryptString($value), true);
        } catch (\Exception $e) {
            // Fallback for unencrypted data (in testing or local seeds)
            return json_decode($value, true) ?: [];
        }
    }
}
