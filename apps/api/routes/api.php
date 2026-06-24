<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Landlord\TenantController;

Route::prefix('v1')->group(function () {
    Route::get('/health', function () {
        return response()->json([
            'success' => true,
            'message' => 'Nexus HR API is healthy',
            'data' => [
                'status' => 'healthy',
                'version' => '1.0.0',
                'php' => PHP_VERSION,
                'laravel' => app()->version(),
                'timestamp' => now()->toISOString(),
            ]
        ]);
    });

    // Central Tenant Management
    Route::get('tenants/list', [TenantController::class, 'publicList']);
    Route::apiResource('tenants', TenantController::class)->only(['index', 'store', 'update', 'destroy']);
});
