<?php

declare(strict_types=1);

namespace Modules\Integration\Contracts;

interface NotificationGatewayInterface
{
    public function send(string $recipient, string $message, array $options = []): bool;
    public function getChannel(): string; // 'email', 'whatsapp', 'sms'
}
