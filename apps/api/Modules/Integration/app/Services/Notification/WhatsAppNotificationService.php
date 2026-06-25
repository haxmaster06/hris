<?php

declare(strict_types=1);

namespace Modules\Integration\Services\Notification;

use Modules\Integration\Contracts\NotificationGatewayInterface;
use Modules\Integration\Models\NotificationLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppNotificationService implements NotificationGatewayInterface
{
    public function getChannel(): string
    {
        return 'whatsapp';
    }

    public function send(string $recipient, string $message, array $options = []): bool
    {
        $log = NotificationLog::create([
            'channel' => 'whatsapp',
            'recipient' => $recipient,
            'message' => $message,
            'status' => 'queued',
            'reference_type' => $options['reference_type'] ?? null,
            'reference_id' => $options['reference_id'] ?? null,
        ]);

        try {
            // WhatsApp API Call Mock/Integration
            // In a production system, this could invoke Twilio, Fonnte, or a similar provider.
            // For now, we simulate success and log the trigger.
            Log::info("WhatsApp message sent to {$recipient}: {$message}");

            $log->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('WhatsApp notification failed: ' . $e->getMessage());

            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
