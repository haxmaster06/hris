<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Employee\Http\Controllers\EmployeeController;
use Modules\Employee\Http\Controllers\EmployeeFamilyController;
use Modules\Employee\Http\Controllers\EmployeeEducationController;
use Modules\Employee\Http\Controllers\EmployeeExperienceController;
use Modules\Employee\Http\Controllers\EmployeeHistoryController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    Route::apiResource('employees', EmployeeController::class);
    Route::apiResource('employees.family', EmployeeFamilyController::class);
    Route::apiResource('employees.education', EmployeeEducationController::class);
    Route::apiResource('employees.experience', EmployeeExperienceController::class);
    
    // Read-only histories routes
    Route::get('employees/{employee}/histories', [EmployeeHistoryController::class, 'index']);
    Route::get('employees/{employee}/histories/{history}', [EmployeeHistoryController::class, 'show']);
});
