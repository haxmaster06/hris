<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Recruitment\Http\Controllers\VacancyController;
use Modules\Recruitment\Http\Controllers\CandidateController;
use Modules\Recruitment\Http\Controllers\JobApplicationController;
use Modules\Recruitment\Http\Controllers\InterviewController;
use Modules\Recruitment\Http\Controllers\HiringApprovalController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    // Vacancies
    Route::post('vacancies/{id}/publish', [VacancyController::class, 'publish']);
    Route::post('vacancies/{id}/close', [VacancyController::class, 'close']);
    Route::apiResource('vacancies', VacancyController::class);

    // Candidates
    Route::apiResource('candidates', CandidateController::class);

    // Job Applications
    Route::post('applications/{id}/move-stage', [JobApplicationController::class, 'moveStage']);
    Route::apiResource('applications', JobApplicationController::class);

    // Interviews
    Route::post('interviews/{id}/submit-result', [InterviewController::class, 'submitResult']);
    Route::post('interviews/{id}/evaluation', [InterviewController::class, 'submitEvaluation']);
    Route::apiResource('interviews', InterviewController::class);

    // Hiring Approvals
    Route::post('hiring-approvals/{id}/approve', [HiringApprovalController::class, 'approve']);
    Route::post('hiring-approvals/{id}/reject', [HiringApprovalController::class, 'reject']);
    Route::apiResource('hiring-approvals', HiringApprovalController::class)->only(['index', 'show']);
});
