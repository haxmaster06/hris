<?php

declare(strict_types=1);

namespace Modules\Audit\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Audit\Repositories\AuditLogRepositoryInterface;
use Modules\Audit\Repositories\AuditLogRepository;
use Modules\Audit\Repositories\LoginHistoryRepositoryInterface;
use Modules\Audit\Repositories\LoginHistoryRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(AuditLogRepositoryInterface::class, AuditLogRepository::class);
        $this->app->singleton(LoginHistoryRepositoryInterface::class, LoginHistoryRepository::class);
    }
}
