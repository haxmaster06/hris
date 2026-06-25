<?php

declare(strict_types=1);

namespace Modules\Workflow\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class WorkflowServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'Workflow';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'workflow';

    /**
     * Provider classes to register.
     *
     * @var string[]
     */
    protected array $providers = [
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
