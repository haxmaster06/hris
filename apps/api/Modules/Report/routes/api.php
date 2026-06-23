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
});
