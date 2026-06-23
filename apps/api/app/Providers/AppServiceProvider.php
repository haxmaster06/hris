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
    }
}
