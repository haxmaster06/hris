<?php

declare(strict_types=1);

namespace Modules\Attendance\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Attendance\Repositories\ShiftRepositoryInterface;
use Modules\Attendance\Repositories\ShiftRepository;
use Modules\Attendance\Repositories\EmployeeShiftRepositoryInterface;
use Modules\Attendance\Repositories\EmployeeShiftRepository;
use Modules\Attendance\Repositories\AttendanceLogRepositoryInterface;
use Modules\Attendance\Repositories\AttendanceLogRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ShiftRepositoryInterface::class, ShiftRepository::class);
        $this->app->bind(EmployeeShiftRepositoryInterface::class, EmployeeShiftRepository::class);
        $this->app->bind(AttendanceLogRepositoryInterface::class, AttendanceLogRepository::class);
    }
}
