<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class JwtAuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // Token in cookies
        $token = $request->cookie('accessToken');


        if (!$token) {
            return response()->failure('Unauthorized. No token provided in header or cookie.', 401);
        }

        try {
            $secret = env('JWT_SECRET'); // Must match Express JWT_SECRET
            if (!$secret) {
                return response()->failure('Server Configuration Error: JWT_SECRET missing.', 500);
            }

            // Decode the token using Firebase JWT
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));

            // Express JWT Payload contains { userId, role }
            $userId = $decoded->userId ?? null;

            if (!$userId) {
                return response()->failure('Unauthorized. Invalid token payload.', 401);
            }

            // Find the user in the database
            $user = User::find($userId);

            if (!$user || !$user->is_active) {
                return response()->failure('Unauthorized. User not found or inactive.', 401);
            }
            //INFO: makes sure that auth()->user() work.
            Auth::setUser($user);
            
            //INFO: makes sure that $request->user() works.
            $request->setUserResolver(function () use ($user) {
                return $user;
            });
        } catch (\Exception $e) {
            return response()->failure('Unauthorized. Token is invalid or expired. ' . $e->getMessage(), 401);
        }

        return $next($request);
    }
}
