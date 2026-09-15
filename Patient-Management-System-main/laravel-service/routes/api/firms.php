<?php
 
 use App\Http\Controllers\FirmController;
 use App\Enums\Role;
 use Illuminate\Support\Facades\Route;
 
 Route::prefix('firms')->group(function () {
     Route::get('/', [FirmController::class, 'index'])->middleware('check.role:' . Role::ADMIN->value);
     Route::get('/{firm}', [FirmController::class, 'show'])->middleware('check.role:' . Role::ADMIN->value);
     Route::post('/', [FirmController::class, 'store'])->middleware('check.role:' . Role::ADMIN->value);
     Route::patch('/{firm}', [FirmController::class, 'update'])->middleware('check.role:' . Role::ADMIN->value);
     Route::delete('/{firm}', [FirmController::class, 'destroy'])->middleware('check.role:' . Role::ADMIN->value);
 });
