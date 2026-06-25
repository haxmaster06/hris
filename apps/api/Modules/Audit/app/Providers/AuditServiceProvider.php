<?php

declare(strict_types=1);

namespace Modules\Audit\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;
use Illuminate\Support\Facades\Event;
use Modules\Audit\Observers\AuditObserver;

class AuditServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'Audit';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'audit';

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

        // Register Global Eloquent Listener for Audit Trail
        $this->registerGlobalAuditListener();
    }

    /**
     * Daftarkan global listener untuk menangkap perubahan data di eloquent secara dinamis.
     */
    private function registerGlobalAuditListener(): void
    {
        Event::listen('eloquent.*', function (string $event, array $models) {
            // Kita hanya memantau event created, updated, deleted, restored
            if (
                str_starts_with($event, 'eloquent.created:') ||
                str_starts_with($event, 'eloquent.updated:') ||
                str_starts_with($event, 'eloquent.deleted:') ||
                str_starts_with($event, 'eloquent.restored:')
            ) {
                // Extact action name (created, updated, deleted, restored)
                $actionPart = explode(':', $event)[0];
                $action = explode('.', $actionPart)[1];

                $observer = $this->app->make(AuditObserver::class);

                foreach ($models as $model) {
                    // Hanya rekam model yang mewarisi BaseModel dan bukan tabel audit_logs sendiri
                    if ($model instanceof \App\Models\BaseModel && !($model instanceof \Modules\Audit\Models\AuditLog)) {
                        switch ($action) {
                            case 'created':
                                $observer->created($model);
                                break;
                            case 'updated':
                                $observer->updated($model);
                                break;
                            case 'deleted':
                                $observer->deleted($model);
                                break;
                            case 'restored':
                                $observer->restored($model);
                                break;
                        }
                    }
                }
            }
        });
    }
}
