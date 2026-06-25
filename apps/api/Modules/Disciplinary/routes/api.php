<?php

use Illuminate\Support\Facades\Route;
use Modules\Disciplinary\Http\Controllers\DisciplinaryCaseController;
use Modules\Disciplinary\Http\Controllers\InvestigationController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::post('disciplinary-cases/{id}/actions', [DisciplinaryCaseController::class, 'issueAction']);
    Route::apiResource('disciplinary-cases', DisciplinaryCaseController::class);
    Route::apiResource('investigations', InvestigationController::class);
});
