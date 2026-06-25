<?php

declare(strict_types=1);

namespace Modules\Audit\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class LoginHistory extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Audit\Database\Factories\LoginHistoryFactory
    {
        return \Modules\Audit\Database\Factories\LoginHistoryFactory::new();
    }

    protected static function booted(): void
    {
        // Nonaktifkan default event listener BaseModel (version, created_by, dll)
    }

    protected static function bootHasAuditFields(): void
    {
        // Nonaktifkan audit trail logging untuk model ini
    }

    protected $table = 'login_histories';

    protected $fillable = [
        'user_id',
        'ip_address',
        'device',
        'browser',
        'os',
        'location',
        'status', // success, failed, locked
        'login_at',
        'logout_at',
        'is_new_device',
    ];

    protected $casts = [
        'login_at' => 'datetime',
        'logout_at' => 'datetime',
        'is_new_device' => 'boolean',
    ];

    /**
     * Relasi ke pengguna terkait.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
