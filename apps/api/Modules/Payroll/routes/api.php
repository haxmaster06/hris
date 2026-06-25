<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Payroll\Http\Controllers\PayrollComponentController;
use Modules\Payroll\Http\Controllers\EmployeeSalaryController;
use Modules\Payroll\Http\Controllers\EmployeeAllowanceController;
use Modules\Payroll\Http\Controllers\PayrollPeriodController;
use Modules\Payroll\Http\Controllers\PayrollRunController;
use Modules\Payroll\Http\Controllers\PayslipController;
use Modules\Payroll\Http\Controllers\EmployeeLoanController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    Route::apiResource('payroll-components', PayrollComponentController::class);
    
    Route::apiResource('employees.salary', EmployeeSalaryController::class)
        ->parameters(['salary' => 'employeeSalary']);
        
    Route::apiResource('employees.allowances', EmployeeAllowanceController::class)
        ->parameters(['allowances' => 'employeeAllowance']);
        
    Route::apiResource('payroll-periods', PayrollPeriodController::class);
    Route::post('payroll-periods/{payrollPeriod}/calculate', [PayrollPeriodController::class, 'calculate']);
    Route::post('payroll-periods/{payrollPeriod}/approve', [PayrollPeriodController::class, 'approve']);
    Route::post('payroll-periods/{payrollPeriod}/lock', [PayrollPeriodController::class, 'lock']);
    
    Route::get('payroll-runs', [PayrollRunController::class, 'index']);
    Route::get('payroll-runs/{payrollRun}', [PayrollRunController::class, 'show']);
    
    Route::get('payslips/{employee}', [PayslipController::class, 'show']);
    Route::apiResource('employee-loans', EmployeeLoanController::class);
});
