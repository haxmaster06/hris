<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;

class CreateTenantCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenant:create {name} {slug} {domain}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new tenant with a database schema and domain mapping';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $name = $this->argument('name');
        $slug = $this->argument('slug');
        $domainName = $this->argument('domain');

        $this->info("Creating tenant '{$name}' with slug '{$slug}'...");

        // Create the tenant in public schema central database
        // This automatically creates PostgreSQL schema "tenant_{slug}", runs migrations and seeds it.
        $tenant = Tenant::create([
            'name' => $name,
            'slug' => $slug,
        ]);

        $this->info("Tenant created! Mapping domain '{$domainName}' to tenant '{$slug}'...");

        // Map the domain to the tenant
        $tenant->domains()->create([
            'domain' => $domainName,
        ]);

        $this->info("Domain mapped successfully!");
        $this->info("Tenant ID: {$tenant->id}");
        $this->info("Schema: " . $tenant->database()->getName());
        $this->info("Access URL: http://{$domainName}");

        return 0;
    }
}
