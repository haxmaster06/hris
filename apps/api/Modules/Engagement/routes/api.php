<?php

use Illuminate\Support\Facades\Route;
use Modules\Engagement\Http\Controllers\SurveyController;
use Modules\Engagement\Http\Controllers\SurveyResponseController;
use Modules\Engagement\Http\Controllers\FeedbackController;
use Modules\Engagement\Http\Controllers\AwardController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::get('surveys/{id}/analytics', [SurveyResponseController::class, 'analytics']);
    Route::post('surveys/{id}/respond', [SurveyResponseController::class, 'store']);
    Route::apiResource('surveys', SurveyController::class);
    
    Route::post('feedbacks/{id}/respond', [FeedbackController::class, 'respond']);
    Route::apiResource('feedbacks', FeedbackController::class);
    
    Route::apiResource('awards', AwardController::class);
});
