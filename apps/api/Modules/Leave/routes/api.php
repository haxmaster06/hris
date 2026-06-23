<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Leave\Http\Controllers\LeaveTypeController;
use Modules\Leave\Http\Controllers\LeaveBalanceController;
use Modules\Leave\Http\Controllers\LeaveRequestController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    // Leave type master CRUD
    Route::apiResource('leave-types', LeaveTypeController::class);

    // Leave balances
    Route::get('leave-balances', [LeaveBalanceController::class, 'index']);
    Route::get('leave-balances/{leave_balance}', [LeaveBalanceController::class, 'show']);

    // Leave requests
    Route::get('leave-requests', [LeaveRequestController::class, 'index']);
    Route::post('leave-requests', [LeaveRequestController::class, 'store']);
    Route::get('leave-requests/{leave_request}', [LeaveRequestController::class, 'show']);
    Route::post('leave-requests/{leave_request}/approve', [LeaveRequestController::class, 'approve']);
    Route::post('leave-requests/{leave_request}/reject', [LeaveRequestController::class, 'reject']);
});
