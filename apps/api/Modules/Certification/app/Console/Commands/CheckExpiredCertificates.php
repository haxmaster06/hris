<?php

namespace Modules\Certification\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use Modules\Certification\Models\EmployeeCertification;
use Carbon\Carbon;

class CheckExpiredCertificates extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'certification:check-expiry';

    /**
     * The console command description.
     */
    protected $description = 'Check and flag expiring or expired employee certifications across all tenants';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting certification expiry check...');

        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            $this->info("Checking certifications for tenant: {$tenant->name} ({$tenant->id})");
            
            tenancy()->initialize($tenant);

            $today = Carbon::today();
            $expiringSoonThreshold = Carbon::today()->addDays(30);

            // Mark expired
            $expiredCount = EmployeeCertification::where('expired_date', '<', $today)
                ->where('status', '!=', 'Expired')
                ->update(['status' => 'Expired']);

            // Mark expiring soon (within 30 days)
            $expiringCount = EmployeeCertification::where('expired_date', '>=', $today)
                ->where('expired_date', '<=', $expiringSoonThreshold)
                ->where('status', '!=', 'Expiring Soon')
                ->update(['status' => 'Expiring Soon']);

            $this->info("Tenant {$tenant->name}: marked {$expiredCount} as Expired, {$expiringCount} as Expiring Soon.");

            tenancy()->end();
        }

        $this->info('Certification expiry check completed.');

        return 0;
    }
}
