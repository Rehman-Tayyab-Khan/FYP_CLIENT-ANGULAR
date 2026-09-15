<?php

use App\Http\Controllers\DashboardController;
use App\Enums\Role;
use Illuminate\Support\Facades\Route;

Route::prefix('dashboard')->group(function () {
    Route::get('/stats', [DashboardController::class, 'stats'])->middleware('check.role:' . Role::ADMIN->value);
    Route::get('/doctor-stats', [DashboardController::class, 'doctorStats'])->middleware('check.role:' . Role::DOCTOR->value);
    Route::get('/fdo-stats', [DashboardController::class, 'fdoStats'])->middleware('check.role:' . Role::FDO->value);
});
