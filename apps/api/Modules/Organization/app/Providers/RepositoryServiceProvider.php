<?php

declare(strict_types=1);

namespace Modules\Organization\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Organization\Repositories\CompanyRepositoryInterface;
use Modules\Organization\Repositories\CompanyRepository;
use Modules\Organization\Repositories\BranchRepositoryInterface;
use Modules\Organization\Repositories\BranchRepository;
use Modules\Organization\Repositories\DepartmentRepositoryInterface;
use Modules\Organization\Repositories\DepartmentRepository;
use Modules\Organization\Repositories\DivisionRepositoryInterface;
use Modules\Organization\Repositories\DivisionRepository;
use Modules\Organization\Repositories\PositionRepositoryInterface;
use Modules\Organization\Repositories\PositionRepository;
use Modules\Organization\Repositories\GradeRepositoryInterface;
use Modules\Organization\Repositories\GradeRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(CompanyRepositoryInterface::class, CompanyRepository::class);
        $this->app->singleton(BranchRepositoryInterface::class, BranchRepository::class);
        $this->app->singleton(DepartmentRepositoryInterface::class, DepartmentRepository::class);
        $this->app->singleton(DivisionRepositoryInterface::class, DivisionRepository::class);
        $this->app->singleton(PositionRepositoryInterface::class, PositionRepository::class);
        $this->app->singleton(GradeRepositoryInterface::class, GradeRepository::class);
    }
}
