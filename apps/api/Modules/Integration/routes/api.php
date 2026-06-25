<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Integration\Http\Controllers\IntegrationConfigController;
use Modules\Integration\Http\Controllers\BankExportController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    Route::get('integration/configs', [IntegrationConfigController::class, 'index']);
    Route::post('integration/configs', [IntegrationConfigController::class, 'store']);
    Route::put('integration/configs/{id}', [IntegrationConfigController::class, 'update']);
    Route::post('integration/test-connection', [IntegrationConfigController::class, 'testConnection']);
    
    Route::post('integration/bank-export', [BankExportController::class, 'export']);
});
