<?php

namespace Modules\Document\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;
use Illuminate\Console\Scheduling\Schedule;

class DocumentServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'Document';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'document';

    /**
     * Command classes to register.
     *
     * @var string[]
     */
    // protected array $commands = [];

    /**
     * Provider classes to register.
     *
     * @var string[]
     */
    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
        RepositoryServiceProvider::class,
    ];

    /**
     * Boot the application events.
     */
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
