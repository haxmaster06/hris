<?php

use Illuminate\Support\Facades\Route;
use Modules\Talent\Http\Controllers\TalentController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('talent', TalentController::class)->names('talent');
});
