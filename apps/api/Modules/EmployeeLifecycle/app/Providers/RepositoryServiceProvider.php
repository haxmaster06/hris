<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\EmployeeLifecycle\Repositories\LifecycleEventRepositoryInterface;
use Modules\EmployeeLifecycle\Repositories\LifecycleEventRepository;
use Modules\EmployeeLifecycle\Repositories\OnboardingChecklistRepositoryInterface;
use Modules\EmployeeLifecycle\Repositories\OnboardingChecklistRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LifecycleEventRepositoryInterface::class, LifecycleEventRepository::class);
        $this->app->singleton(OnboardingChecklistRepositoryInterface::class, OnboardingChecklistRepository::class);
    }
}
