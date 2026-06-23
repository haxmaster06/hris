<?php

declare(strict_types=1);

namespace Modules\Employee\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Employee\Repositories\EmployeeRepositoryInterface;
use Modules\Employee\Repositories\EmployeeRepository;
use Modules\Employee\Repositories\EmployeeFamilyRepositoryInterface;
use Modules\Employee\Repositories\EmployeeFamilyRepository;
use Modules\Employee\Repositories\EmployeeEducationRepositoryInterface;
use Modules\Employee\Repositories\EmployeeEducationRepository;
use Modules\Employee\Repositories\EmployeeExperienceRepositoryInterface;
use Modules\Employee\Repositories\EmployeeExperienceRepository;
use Modules\Employee\Repositories\EmployeeHistoryRepositoryInterface;
use Modules\Employee\Repositories\EmployeeHistoryRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(EmployeeRepositoryInterface::class, EmployeeRepository::class);
        $this->app->singleton(EmployeeFamilyRepositoryInterface::class, EmployeeFamilyRepository::class);
        $this->app->singleton(EmployeeEducationRepositoryInterface::class, EmployeeEducationRepository::class);
        $this->app->singleton(EmployeeExperienceRepositoryInterface::class, EmployeeExperienceRepository::class);
        $this->app->singleton(EmployeeHistoryRepositoryInterface::class, EmployeeHistoryRepository::class);
    }
}
