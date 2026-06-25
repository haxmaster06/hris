<?php

declare(strict_types=1);

namespace Modules\Integration\Services\Notification;

use Modules\Integration\Contracts\NotificationGatewayInterface;
use Modules\Integration\Models\NotificationLog;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailNotificationService implements NotificationGatewayInterface
{
    public function getChannel(): string
    {
        return 'email';
    }

    public function send(string $recipient, string $message, array $options = []): bool
    {
        $log = NotificationLog::create([
            'channel' => 'email',
            'recipient' => $recipient,
            'message' => $message,
            'status' => 'queued',
            'reference_type' => $options['reference_type'] ?? null,
            'reference_id' => $options['reference_id'] ?? null,
        ]);

        try {
            $subject = $options['subject'] ?? 'Nexus HR Notification';
            
            Mail::raw($message, function ($mail) use ($recipient, $subject) {
                $mail->to($recipient)->subject($subject);
            });

            $log->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Email notification failed: ' . $e->getMessage());
            
            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
