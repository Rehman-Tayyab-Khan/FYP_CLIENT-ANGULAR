<?php

use App\Http\Controllers\DiagnosesController;
use App\Enums\Role;
use Illuminate\Support\Facades\Route;

Route::prefix('diagnoses')->group(function () {
    Route::get('/', [DiagnosesController::class, 'index'])->middleware('check.role:' . Role::ADMIN->value . ',' . Role::FDO->value . ',' . Role::DOCTOR->value);
});
