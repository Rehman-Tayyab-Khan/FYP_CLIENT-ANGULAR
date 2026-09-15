<?php

use App\Http\Controllers\InsuranceController;
use App\Enums\Role;
use Illuminate\Support\Facades\Route;

Route::prefix('insurances')->group(function () {
    Route::get('/', [InsuranceController::class, 'index'])->middleware('check.role:' . Role::FDO->value);
    Route::get('/{insurance}', [InsuranceController::class, 'show'])->middleware('check.role:' . Role::ADMIN->value);
    Route::post('/', [InsuranceController::class, 'store'])->middleware('check.role');
    Route::patch('/{insurance}', [InsuranceController::class, 'update'])->middleware('check.role');
    Route::delete('/{insurance}', [InsuranceController::class, 'destroy'])->middleware('check.role');
});
