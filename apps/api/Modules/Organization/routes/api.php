<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Organization\Http\Controllers\CompanyController;
use Modules\Organization\Http\Controllers\BranchController;
use Modules\Organization\Http\Controllers\DepartmentController;
use Modules\Organization\Http\Controllers\DivisionController;
use Modules\Organization\Http\Controllers\PositionController;
use Modules\Organization\Http\Controllers\GradeController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    Route::apiResource('companies', CompanyController::class);
    Route::apiResource('branches', BranchController::class);
    Route::apiResource('departments', DepartmentController::class);
    Route::apiResource('divisions', DivisionController::class);
    Route::apiResource('positions', PositionController::class);
    Route::apiResource('grades', GradeController::class);
});
