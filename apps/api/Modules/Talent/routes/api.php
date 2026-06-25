<?php

use Illuminate\Support\Facades\Route;
use Modules\Talent\Http\Controllers\SkillController;
use Modules\Talent\Http\Controllers\EmployeeSkillController;
use Modules\Talent\Http\Controllers\CareerPathController;
use Modules\Talent\Http\Controllers\SuccessionPlanController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::get('employee-skills/heatmap', [EmployeeSkillController::class, 'heatmap']);
    Route::apiResource('skills', SkillController::class);
    Route::apiResource('employee-skills', EmployeeSkillController::class);
    
    Route::get('career-paths/tree', [CareerPathController::class, 'tree']);
    Route::apiResource('career-paths', CareerPathController::class);
    
    Route::get('succession-plans/nine-box-grid', [SuccessionPlanController::class, 'nineBoxGrid']);
    Route::apiResource('succession-plans', SuccessionPlanController::class);
});
