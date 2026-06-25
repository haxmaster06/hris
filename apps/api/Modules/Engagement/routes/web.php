<?php

use Illuminate\Support\Facades\Route;

Route::get('/engagement', function () {
    return response()->json(['message' => 'Engagement Module']);
});
