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
            // Landlord / Central DB seeders (if any) can be placed here
        }
    }
}
