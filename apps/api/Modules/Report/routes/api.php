<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Report\Http\Controllers\ReportController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    Route::get('reports/employees', [ReportController::class, 'employees']);
    Route::get('reports/attendance', [ReportController::class, 'attendance']);
    Route::get('reports/leave', [ReportController::class, 'leave']);
    Route::get('reports/payroll', [ReportController::class, 'payroll']);
    Route::get('reports/turnover', [ReportController::class, 'turnover']);
    Route::get('reports/retention', [ReportController::class, 'retention']);
    Route::get('reports/headcount', [ReportController::class, 'headcount']);
    Route::get('reports/workforce-summary', [ReportController::class, 'workforceSummary']);
    Route::get('reports/cost-analysis', [ReportController::class, 'costAnalysis']);
    Route::get('reports/training-effectiveness', [ReportController::class, 'trainingEffectiveness']);
});
