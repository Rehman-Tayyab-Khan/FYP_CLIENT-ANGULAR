<?php

use App\Http\Controllers\PracticeLocationController;
use App\Enums\Role;
use Illuminate\Support\Facades\Route;

Route::prefix('practice-locations')->group(function () {
    Route::get('/', [PracticeLocationController::class, 'index']);
    Route::get('/{practiceLocation}', [PracticeLocationController::class, 'show']);
    Route::post('/', [PracticeLocationController::class, 'store'])->middleware('check.role:' . Role::ADMIN->value);
    Route::patch('/{practiceLocation}', [PracticeLocationController::class, 'update'])->middleware('check.role:' . Role::ADMIN->value);
    Route::delete('/{practiceLocation}', [PracticeLocationController::class, 'destroy'])->middleware('check.role:' . Role::ADMIN->value);
});
