<?php

use Illuminate\Support\Facades\Route;

Route::get('/asset', function () {
    return response()->json(['message' => 'Asset Module']);
});
