<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService
    ) {}

    /**
     * Get real-time dashboard statistics.
     *
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = $this->dashboardService->getStats();

            return response()->success($stats, 'Dashboard statistics fetched successfully.');
        } catch (\Exception $e) {
            return response()->failure($e->getMessage(), 500);
        }
    }

    /**
     * Get doctor-focused dashboard statistics.
     *
     * @return JsonResponse
     */
    public function doctorStats(): JsonResponse
    {
        try {
            $stats = $this->dashboardService->getDoctorStats(Auth::user());

            return response()->success($stats, 'Doctor dashboard statistics fetched successfully.');
        } catch (\Exception $e) {
            return response()->failure($e->getMessage(), 500);
        }
    }

    /**
     * Get FDO-focused dashboard statistics.
     *
     * @return JsonResponse
     */
    public function fdoStats(): JsonResponse
    {
        try {
            $stats = $this->dashboardService->getFdoStats(Auth::user());

            return response()->success($stats, 'FDO dashboard statistics fetched successfully.');
        } catch (\Exception $e) {
            return response()->failure($e->getMessage(), 500);
        }
    }
}
