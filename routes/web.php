<?php

use Illuminate\Support\Facades\Route;

foreach (config('tenancy.central_domains') as $domain) {
    Route::domain($domain)->group(function () {
        Route::get('/{any}', function () {
            return view('spa');
        })->where('any', '^(?!central(?:/|$)).*');
    });
}
