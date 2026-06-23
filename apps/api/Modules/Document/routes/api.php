<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Document\Http\Controllers\DocumentCategoryController;
use Modules\Document\Http\Controllers\DocumentController;
use Modules\Document\Http\Controllers\EmployeeDocumentController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    // Document Categories CRUD
    Route::apiResource('document-categories', DocumentCategoryController::class);

    // Generic Document CRUD/Upload
    Route::post('documents/upload', [DocumentController::class, 'store']);
    Route::get('documents/{id}', [DocumentController::class, 'show']);
    Route::delete('documents/{id}', [DocumentController::class, 'destroy']);

    // Employee specific documents
    Route::get('employees/{employee}/documents', [EmployeeDocumentController::class, 'index']);
    Route::post('employees/{employee}/documents', [EmployeeDocumentController::class, 'store']);
});
