<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\EmployeeLifecycle\Http\Controllers\LifecycleEventController;
use Modules\EmployeeLifecycle\Http\Controllers\OnboardingChecklistController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    Route::apiResource('lifecycle-events', LifecycleEventController::class);
    Route::post('lifecycle-events/{lifecycleEvent}/execute', [LifecycleEventController::class, 'execute']);
    
    Route::apiResource('employees.onboarding', OnboardingChecklistController::class)
        ->parameters(['onboarding' => 'onboardingChecklist']);
    Route::patch('employees/{employee}/onboarding/{onboardingChecklist}/complete', [OnboardingChecklistController::class, 'complete']);
});
