<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Request\Visit\UpdateVisitRequest;
use App\Http\Resources\VisitResource;
use App\Models\Visit;
use App\Services\VisitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Response;

class VisitController extends Controller
{
    public function __construct(
        private VisitService $visitService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $visits = $this->visitService->getAll($request, Auth::user());

        return VisitResource::collection($visits)->additional([
            'success' => true,
            'message' => '',
        ]);
    }

    public function show(Visit $visit): JsonResponse
    {
        if (Auth::user()->role->value === Role::DOCTOR->value) {
            $doctorId = Auth::user()->doctorProfile?->id;
            if ($visit->doctor_id !== $doctorId) {
                return Response::failure('Unauthorized.', 403);
            }
        }

        $visit = $this->visitService->getById($visit);

        return Response::success(new VisitResource($visit));
    }

    public function update(UpdateVisitRequest $request, Visit $visit): JsonResponse
    {
        if (Auth::user()->role->value === Role::DOCTOR->value) {
            $doctorId = Auth::user()->doctorProfile?->id;
            if ($visit->doctor_id !== $doctorId) {
                return Response::failure('Unauthorized.', 403);
            }
        }

        $visit = $this->visitService->update(
            $visit,
            $request->validated(),
            Auth::user()->role->value
        );

        return Response::success(
            ['visit' => new VisitResource($visit)],
            'Visit updated successfully.'
        );
    }

    public function destroy(Visit $visit): JsonResponse
    {
        $this->visitService->delete($visit);

        return Response::success([], 'Visit deleted successfully.');
    }
}
