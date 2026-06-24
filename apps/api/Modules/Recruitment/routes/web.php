<?php

use Illuminate\Support\Facades\Route;
use Modules\Recruitment\Http\Controllers\RecruitmentController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('recruitments', RecruitmentController::class)->names('recruitment');
});
