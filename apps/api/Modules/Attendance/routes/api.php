<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Attendance\Http\Controllers\AttendanceController;
use Modules\Attendance\Http\Controllers\ShiftController;
use Modules\Attendance\Http\Controllers\EmployeeShiftController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    // Attendance logging routes
    Route::get('attendances', [AttendanceController::class, 'index']);
    Route::post('attendances/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('attendances/check-out', [AttendanceController::class, 'checkOut']);

    // Shifts management routes
    Route::apiResource('shifts', ShiftController::class);

    // Employee shifts mapping routes
    Route::apiResource('employee-shifts', EmployeeShiftController::class);
});
