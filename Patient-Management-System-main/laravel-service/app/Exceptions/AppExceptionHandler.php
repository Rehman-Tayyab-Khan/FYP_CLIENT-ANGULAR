<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Validation\ValidationException;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class AppExceptionHandler
{


    public function register(Exceptions $exception): void
    {
        $this->RegisterValidationExceptionHandler($exception);
        $this->RegisterAuthenticationExceptionHandler($exception);
        $this->RegisterHttpExceptionHandler($exception);
        $this->RegisterNotFoundExceptionHandler($exception);
        $this->RegisterQueryExceptionHandler($exception);
        $this->RegisterDefaultHandler($exception);
    }
    private function RegisterValidationExceptionHandler(Exceptions $exceptions): void
    {
        $exceptions->render(function (ValidationException $e, Request $request) {
            return response()->failure($e->getMessage(), 422);
        });
    }
    private function RegisterAuthenticationExceptionHandler(Exceptions $exceptions): void
    {
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return response()->failure('Unauthenticated.', 401);
        });
    }
    private function RegisterHttpExceptionHandler(Exceptions $exceptions): void
    {
        $exceptions->render(function (HttpException $e, Request $request) {
            return response()->failure($e->getMessage() ?: 'HTTP error.', $e->getStatusCode());
        });
    }
    private function RegisterNotFoundExceptionHandler(Exceptions $exceptions): void
    {
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            return response()->failure('Resource not found.', 404);
        });
    }
    private function RegisterQueryExceptionHandler(Exceptions $exceptions): void
    {
        $exceptions->render(function (QueryException $e, Request $request) {

            if ($e->getCode() == '23000' && str_contains($e->getMessage(), 'Duplicate entry')) {
                // INFO: Using regex for column matching
                preg_match("/for key '(.+?)'/", $e->getMessage(), $matches);
                $column = $matches[1] ?? 'unknown';
                return response()->failure("$column already exists", 409);
            }
        });
    }
    private function RegisterDefaultHandler(Exceptions $exceptions): void
    {
        $exceptions->render(function (Throwable $e, Request $request) {
            return response()->failure(
                app()->isProduction() ? 'Something went wrong.' : $e->getMessage(),
                500
            );
        });
    }
}
