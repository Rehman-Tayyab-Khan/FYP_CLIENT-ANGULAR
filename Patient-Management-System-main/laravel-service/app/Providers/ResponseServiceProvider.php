<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Response;

class ResponseServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $normalizeStatus = static function (int $status, int $fallback): int {
            return ($status >= 100 && $status <= 599) ? $status : $fallback;
        };

        Response::macro('success', function ($data = [], string $message = '', int $status = 200) use ($normalizeStatus) {
            $safeStatus = $normalizeStatus($status, 200);

            return Response::json([
                'success' => true,
                'data' => $data,
                'message' => $message
            ], $safeStatus);
        });
        Response::macro('failure', function (string $message = '', int $status = 400) use ($normalizeStatus) {
            $safeStatus = $normalizeStatus($status, 400);

            return Response::json([
                'success' => false,
                'message' => $message
            ], $safeStatus);
        });
    }
}
