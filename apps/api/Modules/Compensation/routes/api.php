<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Compensation\Http\Controllers\BenefitController;
use Modules\Compensation\Http\Controllers\EmployeeBenefitController;
use Modules\Compensation\Http\Controllers\ClaimController;
use Modules\Compensation\Http\Controllers\BonusSchemeController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    Route::apiResource('benefits', BenefitController::class);
    
    Route::apiResource('employees.benefits', EmployeeBenefitController::class)
        ->parameters(['benefits' => 'employeeBenefit']);
        
    Route::apiResource('claims', ClaimController::class);
    Route::post('claims/{claim}/approve', [ClaimController::class, 'approve']);
    Route::post('claims/{claim}/reject', [ClaimController::class, 'reject']);
    
    Route::apiResource('bonus-schemes', BonusSchemeController::class);
});
