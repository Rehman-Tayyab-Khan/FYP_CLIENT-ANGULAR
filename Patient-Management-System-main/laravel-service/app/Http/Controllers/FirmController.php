<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Request\Firm\StoreFirmRequest;
use App\Http\Request\Firm\UpdateFirmRequest;
use App\Http\Resources\FirmResource;
use App\Models\Firm;
use App\Services\FirmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class FirmController extends Controller
{
    public function __construct(
        private FirmService $firmService
    ) {}

    // List
    public function index(Request $request)
    {
        $user = auth()->user();
        $role = $user ? $user->role->value : Role::ADMIN->value;

        if ($role !== Role::ADMIN->value) {
            return response()->failure('Only Admins can view firms.', 403);
        }

        $firms = $this->firmService->getAll($request);
        return FirmResource::collection($firms);
    }

    // Show
    public function show(Firm $firm): JsonResponse
    {
        $user = auth()->user();
        $role = $user ? $user->role->value : Role::ADMIN->value;

        if ($role !== Role::ADMIN->value) {
            return response()->failure('Only Admins can view firm details.', 403);
        }

        return response()->success(['firm' => new FirmResource($firm)]);
    }

    // Create
    public function store(StoreFirmRequest $request): JsonResponse
    {
        $user = auth()->user();
        $role = $user ? $user->role->value : Role::ADMIN->value;
        
        if ($role !== Role::ADMIN->value) {
            return response()->failure('Only admins can create firms.', 403);
        }

        try {
            $validated = $request->validated();
            $firm = $this->firmService->create($validated);

            return response()->success(
                ['firm' => new FirmResource($firm)],
                'Firm created successfully.',
                201
            );
        } catch (\Exception $e) {
            return response()->failure($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    // Update
    public function update(UpdateFirmRequest $request, Firm $firm): JsonResponse
    {
        $user = auth()->user();
        $role = $user ? $user->role->value : Role::ADMIN->value;

        if ($role !== Role::ADMIN->value) {
            return response()->failure('Only admins can update firms.', 403);
        }

        try {
            $validated = $request->validated();
            $firm = $this->firmService->update($firm, $validated);

            return response()->success(
                ['firm' => new FirmResource($firm)],
                'Firm updated successfully.'
            );
        } catch (\Exception $e) {
            return response()->failure($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    // Delete
    public function destroy(Firm $firm): JsonResponse
    {
        $user = auth()->user();
        $role = $user ? $user->role->value : Role::ADMIN->value;

        if ($role !== Role::ADMIN->value) {
            return response()->failure('Only admins can delete firms.', 403);
        }

        $this->firmService->delete($firm);
        return response()->success([], 'Firm deleted successfully.');
    }
}
