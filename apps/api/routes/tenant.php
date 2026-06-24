<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Here you can register the tenant routes for your application.
| These routes are loaded by the TenantRouteServiceProvider.
|
| Feel free to customize them however you want. Good luck!
|
*/

// API routes
Route::middleware([
    'api',
    InitializeTenancy::class,
])->prefix('api/v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        
        Route::middleware('auth:api')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });
    });

    // Authenticated Tenant Routes
    Route::middleware('auth:api')->group(function () {
        Route::apiResource('users', \App\Http\Controllers\Tenant\UserController::class);
        Route::apiResource('roles', \App\Http\Controllers\Tenant\RoleController::class);
        Route::get('permissions', [\App\Http\Controllers\Tenant\PermissionController::class, 'index']);
        Route::get('tenant/settings', [\App\Http\Controllers\Tenant\TenantSettingsController::class, 'show']);
        Route::put('tenant/settings', [\App\Http\Controllers\Tenant\TenantSettingsController::class, 'update']);
    });
});
