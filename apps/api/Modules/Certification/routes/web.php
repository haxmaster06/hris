<?php

use Illuminate\Support\Facades\Route;
use Modules\Certification\Http\Controllers\CertificationController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('certifications', CertificationController::class)->names('certification');
});
