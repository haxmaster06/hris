<?php

declare(strict_types=1);

namespace Modules\Certification\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Certification\Repositories\CertificationRepositoryInterface;
use Modules\Certification\Repositories\CertificationRepository;
use Modules\Certification\Repositories\EmployeeCertificationRepositoryInterface;
use Modules\Certification\Repositories\EmployeeCertificationRepository;
use Modules\Certification\Repositories\CertificationRequirementRepositoryInterface;
use Modules\Certification\Repositories\CertificationRequirementRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(CertificationRepositoryInterface::class, CertificationRepository::class);
        $this->app->singleton(EmployeeCertificationRepositoryInterface::class, EmployeeCertificationRepository::class);
        $this->app->singleton(CertificationRequirementRepositoryInterface::class, CertificationRequirementRepository::class);
    }
}
