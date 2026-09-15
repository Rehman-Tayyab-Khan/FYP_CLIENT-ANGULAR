<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Request\PracticeLocation\StorePracticeLocationRequest;
use App\Http\Request\PracticeLocation\UpdatePracticeLocationRequest;
use App\Http\Resources\PracticeLocationResource;
use App\Models\PracticeLocation;
use App\Services\PracticeLocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PracticeLocationController extends Controller
{
    public function __construct(
        private PracticeLocationService $practiceLocationService
    ) {}

    // List
    public function index(Request $request)
    {
        $practiceLocations = $this->practiceLocationService->getAll($request);
        return PracticeLocationResource::collection($practiceLocations);
    }

    // Show
    public function show(PracticeLocation $practiceLocation): JsonResponse
    {
        return response()->success(new PracticeLocationResource($practiceLocation));
    }

    // Create
    public function store(StorePracticeLocationRequest $request): JsonResponse
    {
        $role = auth()->user()->role->value;
        
        if ($role === Role::FDO->value) {
            return response()->failure('You don\'t have permission to create a practice location. Only Admins can perform this action.', 403);
        }

        try {
            $validated = $request->validated();
            $practiceLocation = $this->practiceLocationService->create($validated);

            return response()->success(
                ['practice_location' => new PracticeLocationResource($practiceLocation)],
                'Practice location created successfully.',
                201
            );
        } catch (\Exception $e) {
            return response()->failure($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    // Update
    public function update(UpdatePracticeLocationRequest $request, PracticeLocation $practiceLocation): JsonResponse
    {
        try {
            $validated = $request->validated();
            $practiceLocation = $this->practiceLocationService->update($practiceLocation, $validated);

            return response()->success(
                ['practice_location' => new PracticeLocationResource($practiceLocation)],
                'Practice location updated successfully.'
            );
        } catch (\Exception $e) {
            return response()->failure($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    // Delete
    public function destroy(PracticeLocation $practiceLocation): JsonResponse
    {
        $this->practiceLocationService->delete($practiceLocation);
        return response()->success([], 'Practice location deleted successfully.');
    }
}
