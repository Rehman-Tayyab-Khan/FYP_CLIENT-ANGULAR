<?php

use App\Http\Controllers\VisitController;
use App\Enums\Role;
use Illuminate\Support\Facades\Route;

Route::prefix('visits')->group(function () {
    // Admin and doctor can list and view visits. FDO can view for operational visibility.
    Route::get('/', [VisitController::class, 'index'])->middleware('check.role:' . Role::ADMIN->value . ',' . Role::FDO->value . ',' . Role::DOCTOR->value);
    Route::get('/{visit}', [VisitController::class, 'show'])->middleware('check.role:' . Role::ADMIN->value . ',' . Role::FDO->value . ',' . Role::DOCTOR->value);

    // No create endpoint: visits are auto-created when appointment status becomes Completed.
    Route::patch('/{visit}', [VisitController::class, 'update'])->middleware('check.role:' . Role::ADMIN->value . ',' . Role::DOCTOR->value);

    // Admin-only soft delete.
    Route::delete('/{visit}', [VisitController::class, 'destroy'])->middleware('check.role:' . Role::ADMIN->value);
});
