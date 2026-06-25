<?php

use Illuminate\Support\Facades\Route;
use Modules\Asset\Http\Controllers\AssetController;
use Modules\Asset\Http\Controllers\AssetAssignmentController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::post('asset-assignments/{id}/return', [AssetAssignmentController::class, 'returnAsset']);
    Route::apiResource('asset-assignments', AssetAssignmentController::class);
    Route::apiResource('assets', AssetController::class);
});
