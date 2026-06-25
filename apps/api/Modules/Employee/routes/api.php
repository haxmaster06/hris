<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Employee\Http\Controllers\EmployeeController;
use Modules\Employee\Http\Controllers\EmployeeFamilyController;
use Modules\Employee\Http\Controllers\EmployeeEducationController;
use Modules\Employee\Http\Controllers\EmployeeExperienceController;
use Modules\Employee\Http\Controllers\EmployeeHistoryController;
use Modules\Employee\Http\Controllers\EmergencyContactController;
use Modules\Employee\Http\Controllers\ProfileUpdateRequestController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    Route::apiResource('employees', EmployeeController::class);
    Route::apiResource('employees.family', EmployeeFamilyController::class);
    Route::apiResource('employees.education', EmployeeEducationController::class);
    Route::apiResource('employees.experience', EmployeeExperienceController::class);
    Route::apiResource('employees.emergency-contacts', EmergencyContactController::class)
        ->parameters(['emergency-contacts' => 'emergencyContact']);
    
    // Read-only histories routes
    Route::get('employees/{employee}/histories', [EmployeeHistoryController::class, 'index']);
    Route::get('employees/{employee}/histories/{history}', [EmployeeHistoryController::class, 'show']);

    // Profile update requests routes
    Route::get('profile-update-requests', [ProfileUpdateRequestController::class, 'index']);
    Route::post('profile-update-requests', [ProfileUpdateRequestController::class, 'store']);
    Route::post('profile-update-requests/{id}/approve', [ProfileUpdateRequestController::class, 'approve']);
    Route::post('profile-update-requests/{id}/reject', [ProfileUpdateRequestController::class, 'reject']);
});
