<?php

namespace Modules\Integration\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class IntegrationServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Integration';

    protected string $nameLower = 'integration';

    protected array $providers = [
        RouteServiceProvider::class,
    ];

    public function boot(): void
    {
        $this->registerCommands();
        $this->registerCommandSchedules();
        $this->registerTranslations();
        $this->registerConfig();
        $this->registerViews();

        if ($this->app->runningInConsole()) {
            $paths = config('tenancy.migration_parameters.--path', []);
            $paths[] = module_path($this->name, 'database/migrations');
            config(['tenancy.migration_parameters.--path' => array_unique($paths)]);
        }
    }
}
