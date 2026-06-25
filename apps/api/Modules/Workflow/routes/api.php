<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Workflow\Http\Controllers\WorkflowDefinitionController;
use Modules\Workflow\Http\Controllers\WorkflowStepController;
use Modules\Workflow\Http\Controllers\WorkflowInstanceController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    Route::apiResource('workflow-definitions', WorkflowDefinitionController::class);
    Route::apiResource('workflow-definitions.steps', WorkflowStepController::class);
    Route::post('workflow-definitions/{workflowDefinition}/steps/reorder', [WorkflowStepController::class, 'reorder']);
    
    Route::get('workflow-instances', [WorkflowInstanceController::class, 'index']);
    Route::get('workflow-instances/{workflowInstance}', [WorkflowInstanceController::class, 'show']);
    Route::post('workflow-instances/{workflowInstance}/approve', [WorkflowInstanceController::class, 'approve']);
    Route::post('workflow-instances/{workflowInstance}/reject', [WorkflowInstanceController::class, 'reject']);
    Route::post('workflow-instances/{workflowInstance}/return', [WorkflowInstanceController::class, 'return']);
});
