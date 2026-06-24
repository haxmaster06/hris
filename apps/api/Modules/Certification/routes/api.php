<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Certification\Http\Controllers\CertificationController;
use Modules\Certification\Http\Controllers\EmployeeCertificationController;
use Modules\Certification\Http\Controllers\CertificationRequirementController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    // Master Certifications
    Route::apiResource('certifications', CertificationController::class);

    // Employee Certifications (Upload & Expiry check)
    Route::get('employee-certifications/stats/expiry', [EmployeeCertificationController::class, 'expiryStats']);
    Route::get('employee-certifications/{id}/download', [EmployeeCertificationController::class, 'download']);
    Route::apiResource('employee-certifications', EmployeeCertificationController::class);

    // Certification Matrix / Requirements
    Route::apiResource('certification-requirements', CertificationRequirementController::class);
});
