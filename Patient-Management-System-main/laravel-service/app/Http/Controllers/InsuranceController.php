<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Request\Insurance\StoreInsuranceRequest;
use App\Http\Request\Insurance\UpdateInsuranceRequest;
use App\Http\Resources\InsuranceResource;
use App\Models\Insurance;
use App\Services\InsuranceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class InsuranceController extends Controller
{
    public function __construct(
        private InsuranceService $insuranceService
    ) {}

    // List
    public function index(Request $request)
    {
        // Handled by check.role middleware in routes, but good to have fallback
        $user = auth()->user();
        $role = $user ? $user->role->value : Role::ADMIN->value;

        if (!in_array($role, [Role::ADMIN->value, Role::FDO->value])) {
            return response()->failure('Only Admins and FDOs can view insurances.', 403);
        }

        $insurances = $this->insuranceService->getAll($request);
        return InsuranceResource::collection($insurances);
    }

    // Show
    public function show(Insurance $insurance): JsonResponse
    {
        $user = auth()->user();
        $role = $user ? $user->role->value : Role::ADMIN->value;

        if (!in_array($role, [Role::ADMIN->value, Role::FDO->value])) {
            return response()->failure('Only Admins and FDOs can view insurances.', 403);
        }

        $insurance = $this->insuranceService->getById($insurance);

        return response()->success([
            'insurance' => new InsuranceResource($insurance),
        ]);
    }

    // Create
    public function store(StoreInsuranceRequest $request): JsonResponse
    {
        $user = auth()->user();
        $role = $user ? $user->role->value : Role::ADMIN->value;

        if ($role !== Role::ADMIN->value) {
            return response()->failure('Only admins can create insurances.', 403);
        }

        try {
            $validated = $request->validated();
            $insurance = $this->insuranceService->create($validated);

            return response()->success(
                ['insurance' => new InsuranceResource($insurance)],
                'Insurance created successfully.',
                201
            );
        } catch (\Exception $e) {
            return response()->failure($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    // Update
    public function update(UpdateInsuranceRequest $request, Insurance $insurance): JsonResponse
    {
        $user = auth()->user();
        $role = $user ? $user->role->value : Role::ADMIN->value;

        if ($role !== Role::ADMIN->value) {
            return response()->failure('Only admins can update insurances.', 403);
        }

        try {
            $validated = $request->validated();
            $insurance = $this->insuranceService->update($insurance, $validated);

            return response()->success(
                ['insurance' => new InsuranceResource($insurance)],
                'Insurance updated successfully.'
            );
        } catch (\Exception $e) {
            return response()->failure($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    // Delete
    public function destroy(Insurance $insurance): JsonResponse
    {
        $user = auth()->user();
        $role = $user ? $user->role->value : Role::ADMIN->value;

        if ($role !== Role::ADMIN->value) {
            return response()->failure('Only admins can delete insurances.', 403);
        }

        $this->insuranceService->delete($insurance);
        return response()->success([], 'Insurance deleted successfully.');
    }
}
