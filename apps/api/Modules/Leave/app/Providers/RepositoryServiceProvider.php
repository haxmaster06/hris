<?php

declare(strict_types=1);

namespace Modules\Leave\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Leave\Repositories\LeaveTypeRepositoryInterface;
use Modules\Leave\Repositories\LeaveTypeRepository;
use Modules\Leave\Repositories\LeaveBalanceRepositoryInterface;
use Modules\Leave\Repositories\LeaveBalanceRepository;
use Modules\Leave\Repositories\LeaveRequestRepositoryInterface;
use Modules\Leave\Repositories\LeaveRequestRepository;
use Modules\Leave\Repositories\LeaveApprovalRepositoryInterface;
use Modules\Leave\Repositories\LeaveApprovalRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(LeaveTypeRepositoryInterface::class, LeaveTypeRepository::class);
        $this->app->bind(LeaveBalanceRepositoryInterface::class, LeaveBalanceRepository::class);
        $this->app->bind(LeaveRequestRepositoryInterface::class, LeaveRequestRepository::class);
        $this->app->bind(LeaveApprovalRepositoryInterface::class, LeaveApprovalRepository::class);
    }
}
