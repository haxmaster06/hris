<?php

use Illuminate\Support\Facades\Route;
use Modules\Disciplinary\Http\Controllers\DisciplinaryController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('disciplinaries', DisciplinaryController::class)->names('disciplinary');
});
