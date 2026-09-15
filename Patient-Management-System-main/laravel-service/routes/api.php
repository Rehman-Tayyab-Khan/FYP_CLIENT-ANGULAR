<?php

use Illuminate\Support\Facades\Route;

Route::middleware('jwt.auth')->group(function () {
    require __DIR__ . '/api/dashboard.php';
    require __DIR__ . '/api/appointments.php';
    require __DIR__ . '/api/visits.php';
    require __DIR__ . '/api/practice-locations.php';
    require __DIR__ . '/api/insurances.php';
    require __DIR__ . '/api/diagnoses.php';
    require __DIR__ . '/api/firms.php';
});
