<?php

namespace App\Http\Controllers;

use App\Http\Resources\DiagnosesResource;
use App\Services\DiagnosesService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;

class DiagnosesController extends Controller
{
    public function __construct(
        private DiagnosesService $diagnosesService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $diagnoses = $this->diagnosesService->getAll($request);

        return DiagnosesResource::collection($diagnoses)->additional([
            'success' => true,
            'message' => '',
        ]);
    }
}
