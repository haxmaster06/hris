<?php

use Illuminate\Support\Facades\Route;

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
});
