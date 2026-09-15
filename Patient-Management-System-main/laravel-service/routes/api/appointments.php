<?php

use App\Http\Controllers\AppointmentController;
use App\Enums\Role;
use Illuminate\Support\Facades\Route;

Route::prefix('appointments')->group(function () {

    // All roles can list and view
    Route::get('/', [AppointmentController::class, 'index'])->middleware('check.role:' . Role::ADMIN->value . ',' . Role::FDO->value . ',' . Role::DOCTOR->value);
    Route::get('/{appointment}', [AppointmentController::class, 'show'])->middleware('check.role:' . Role::ADMIN->value . ',' . Role::FDO->value . ',' . Role::DOCTOR->value);

    // FDO and Admin only — create
    Route::post('/', [AppointmentController::class, 'store'])->middleware('check.role:' . Role::ADMIN->value . ',' . Role::FDO->value);

    // Role-restricted update (doctor = status only, FDO/Admin = full)
    Route::patch('/{appointment}', [AppointmentController::class, 'update'])->middleware('check.role:' . Role::ADMIN->value . ',' . Role::FDO->value . ',' . Role::DOCTOR->value);

    // Doctor-only completion endpoint with visit + diagnosis details
    Route::patch('/{appointment}/complete', [AppointmentController::class, 'complete'])->middleware('check.role:' . Role::DOCTOR->value);

    // FDO and Admin only — cancel
    Route::patch('/{appointment}/cancel', [AppointmentController::class, 'cancel'])->middleware('check.role:' . Role::ADMIN->value . ',' . Role::FDO->value);

    // Admin only — soft delete
    Route::delete('/{appointment}', [AppointmentController::class, 'destroy'])->middleware('check.role');
});
