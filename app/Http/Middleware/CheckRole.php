<?php
// ===== app/Http/Middleware/CheckRole.php =====

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasAnyRole($roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès interdit. Rôle insuffisant.',
                'code' => 'FORBIDDEN',
            ], 403);
        }

        return $next($request);
    }
}
