<?php

use Illuminate\Support\Facades\Route;
use Modules\Performance\Http\Controllers\KPIController;
use Modules\Performance\Http\Controllers\KPIAssignmentController;
use Modules\Performance\Http\Controllers\PerformancePeriodController;
use Modules\Performance\Http\Controllers\PerformanceReviewController;
use Modules\Performance\Http\Controllers\ImprovementPlanController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('kpis', KPIController::class);
    Route::apiResource('kpi-assignments', KPIAssignmentController::class);
    
    Route::post('performance-periods/{id}/start-review', [PerformancePeriodController::class, 'startReview']);
    Route::apiResource('performance-periods', PerformancePeriodController::class);
    
    Route::post('performance-reviews/{id}/self-review', [PerformanceReviewController::class, 'submitSelfReview']);
    Route::post('performance-reviews/{id}/manager-review', [PerformanceReviewController::class, 'submitManagerReview']);
    Route::post('performance-reviews/{id}/hr-review', [PerformanceReviewController::class, 'submitHRReview']);
    Route::apiResource('performance-reviews', PerformanceReviewController::class);
    
    Route::apiResource('improvement-plans', ImprovementPlanController::class);
});
