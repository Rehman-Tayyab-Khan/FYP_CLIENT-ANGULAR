<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Enums\Role;

class CheckRole
{
    //INFO: ... for expecting multiple values 
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->failure('Unauthorized. No user authenticated.', 401);
        } else {
            $userRole = $user->role?->value;
        }

        if ($userRole === Role::ADMIN->value || in_array($userRole, $roles)) {
            return $next($request);
        }
        return response()->failure('Forbidden. You do not have the required role.', 403);
    }
}
