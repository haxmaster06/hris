<?php

declare(strict_types=1);

namespace Modules\Payroll\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Payroll\Repositories\PayrollComponentRepositoryInterface;
use Modules\Payroll\Repositories\PayrollComponentRepository;
use Modules\Payroll\Repositories\EmployeeSalaryRepositoryInterface;
use Modules\Payroll\Repositories\EmployeeSalaryRepository;
use Modules\Payroll\Repositories\EmployeeAllowanceRepositoryInterface;
use Modules\Payroll\Repositories\EmployeeAllowanceRepository;
use Modules\Payroll\Repositories\PayrollPeriodRepositoryInterface;
use Modules\Payroll\Repositories\PayrollPeriodRepository;
use Modules\Payroll\Repositories\PayrollRunRepositoryInterface;
use Modules\Payroll\Repositories\PayrollRunRepository;
use Modules\Payroll\Repositories\EmployeeLoanRepositoryInterface;
use Modules\Payroll\Repositories\EmployeeLoanRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PayrollComponentRepositoryInterface::class, PayrollComponentRepository::class);
        $this->app->singleton(EmployeeSalaryRepositoryInterface::class, EmployeeSalaryRepository::class);
        $this->app->singleton(EmployeeAllowanceRepositoryInterface::class, EmployeeAllowanceRepository::class);
        $this->app->singleton(PayrollPeriodRepositoryInterface::class, PayrollPeriodRepository::class);
        $this->app->singleton(PayrollRunRepositoryInterface::class, PayrollRunRepository::class);
        $this->app->singleton(EmployeeLoanRepositoryInterface::class, EmployeeLoanRepository::class);
    }
}
