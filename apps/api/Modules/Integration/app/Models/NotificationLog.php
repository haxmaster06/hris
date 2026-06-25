<?php

declare(strict_types=1);

namespace Modules\Integration\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class NotificationLog extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'notification_logs';

    protected $fillable = [
        'channel',
        'recipient',
        'message',
        'status',
        'error_message',
        'reference_type',
        'reference_id',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];
}
