<?php

use Illuminate\Support\Facades\Route;
use Modules\Leave\Http\Controllers\LeaveController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('leaves', LeaveController::class)->names('leave');
});
