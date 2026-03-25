<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckModule
{
    public function handle(Request $request, Closure $next, string $module): Response
    {
        $tenant = tenant();

        if ($tenant && !in_array($module, $tenant->getActiveModules(), true)) {
            return response()->json([
                'success' => false,
                'message' => "Le module « {$module} » n'est pas activé pour cet établissement.",
            ], 403);
        }

        return $next($request);
    }
}
