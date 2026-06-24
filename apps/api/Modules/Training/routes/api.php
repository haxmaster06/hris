<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Training\Http\Controllers\TrainingController;
use Modules\Training\Http\Controllers\TrainingSessionController;
use Modules\Training\Http\Controllers\TrainingParticipantController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    // Master Trainings
    Route::apiResource('trainings', TrainingController::class);

    // Training Sessions
    Route::apiResource('training-sessions', TrainingSessionController::class);

    // Training Participants (Absensi & Scoring)
    Route::apiResource('training-participants', TrainingParticipantController::class);
});
