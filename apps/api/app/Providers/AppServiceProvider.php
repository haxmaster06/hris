<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        \Stancl\Tenancy\DatabaseConfig::generateDatabaseNamesUsing(function ($tenant) {
            // Strip hyphens from UUID for clean PostgreSQL schema names
            $cleanId = str_replace('-', '', (string) $tenant->id);
            return config('tenancy.database.prefix') . $cleanId . config('tenancy.database.suffix');
        });

        // Super Admin Authorization Gate Bypass
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            if (isset($user->is_super_admin) && $user->is_super_admin === true) {
                return true;
            }
            try {
                if ($user->hasRole('Super Admin')) {
                    return true;
                }
            } catch (\Exception $e) {
                // Ignore DB exceptions when roles table might not exist during migrations
            }
            return null;
        });
    }
}
