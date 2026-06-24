<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Check if we are running in a tenant context (schema switching active)
        if (tenancy()->initialized) {
            $this->call([
                TenantPermissionSeeder::class,
                TenantAdminSeeder::class,
            ]);
        } else {
            // Seed central tenants if they don't exist yet to support multiple tenant setups
            if (!\App\Models\Tenant::where('slug', 'haxmaster')->exists()) {
                $tenant1 = \App\Models\Tenant::create([
                    'id' => 'haxmaster',
                    'name' => 'Haxmaster Utama Corp',
                    'slug' => 'haxmaster',
                ]);
                $tenant1->domains()->create([
                    'domain' => 'haxmaster.local',
                ]);
            }

            if (!\App\Models\Tenant::where('slug', 'haxmaster2')->exists()) {
                $tenant2 = \App\Models\Tenant::create([
                    'id' => 'haxmaster2',
                    'name' => 'Haxmaster Sekunder Ltd',
                    'slug' => 'haxmaster2',
                ]);
                $tenant2->domains()->create([
                    'domain' => 'haxmaster2.local',
                ]);
            }
        }
    }
}
