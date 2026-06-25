<?php

declare(strict_types=1);

namespace Modules\Compensation\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Compensation\Repositories\BenefitRepositoryInterface;
use Modules\Compensation\Repositories\BenefitRepository;
use Modules\Compensation\Repositories\EmployeeBenefitRepositoryInterface;
use Modules\Compensation\Repositories\EmployeeBenefitRepository;
use Modules\Compensation\Repositories\ClaimRepositoryInterface;
use Modules\Compensation\Repositories\ClaimRepository;
use Modules\Compensation\Repositories\BonusSchemeRepositoryInterface;
use Modules\Compensation\Repositories\BonusSchemeRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(BenefitRepositoryInterface::class, BenefitRepository::class);
        $this->app->singleton(EmployeeBenefitRepositoryInterface::class, EmployeeBenefitRepository::class);
        $this->app->singleton(ClaimRepositoryInterface::class, ClaimRepository::class);
        $this->app->singleton(BonusSchemeRepositoryInterface::class, BonusSchemeRepository::class);
    }
}
