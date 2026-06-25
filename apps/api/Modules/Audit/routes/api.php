<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancy;
use Modules\Audit\Http\Controllers\AuditLogController;
use Modules\Audit\Http\Controllers\LoginHistoryController;
use Modules\Audit\Http\Controllers\ComplianceController;

Route::middleware([
    InitializeTenancy::class,
    'auth:api',
])->prefix('v1')->group(function () {
    Route::get('audit-logs', [AuditLogController::class, 'index']);
    Route::get('audit-logs/{auditLog}', [AuditLogController::class, 'show']);
    
    Route::get('login-histories', [LoginHistoryController::class, 'index']);

    Route::get('compliance/expiring-contracts', [ComplianceController::class, 'expiringContracts']);
    Route::get('compliance/expiring-certifications', [ComplianceController::class, 'expiringCertifications']);
});
