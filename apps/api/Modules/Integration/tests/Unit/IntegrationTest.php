<?php

declare(strict_types=1);

namespace Modules\Integration\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Integration\Models\IntegrationConfig;
use Modules\Integration\Models\NotificationLog;
use Modules\Integration\Services\BankExport\BCABankExport;
use Modules\Integration\Services\BankExport\MandiriBankExport;

class IntegrationTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        // Create tenant
        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Integration Test Tenant',
            'slug' => 'integrationtest',
        ]);

        tenancy()->initialize($this->tenant);
    }

    public function test_integration_config_encryption(): void
    {
        $config = IntegrationConfig::create([
            'type' => 'notification',
            'provider' => 'whatsapp',
            'name' => 'Fonnte WA Gateway',
            'config' => [
                'api_key' => 'secret_token_123',
                'endpoint' => 'https://api.fonnte.com/send'
            ],
            'is_active' => true,
        ]);

        $this->assertNotNull($config->id);
        
        // Decrypted configuration should be readable
        $this->assertEquals('secret_token_123', $config->config['api_key']);
    }

    public function test_notification_logs(): void
    {
        $log = NotificationLog::create([
            'tenant_id' => $this->tenantId,
            'channel' => 'whatsapp',
            'recipient' => '081234567890',
            'message' => 'Test message',
            'status' => 'queued',
        ]);

        $this->assertNotNull($log->id);
        $this->assertEquals('queued', $log->status);
    }

    public function test_bank_export_format_names(): void
    {
        $bca = new BCABankExport();
        $this->assertEquals('BCA', $bca->getBankName());
        $this->assertEquals('csv', $bca->getFormat());

        $mandiri = new MandiriBankExport();
        $this->assertEquals('Mandiri', $mandiri->getBankName());
        $this->assertEquals('txt', $mandiri->getFormat());
    }
}
