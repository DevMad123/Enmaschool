<?php

declare(strict_types=1);

namespace Tests\Traits;

use App\Models\Central\Tenant;
use App\Models\Tenant\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Testing\TestResponse;

/**
 * Trait to initialize tenancy in feature tests.
 *
 * Approach: create real Sanctum tokens so that HTTP test requests go through
 * the full middleware stack (InitializeTenancyByDomain + Sanctum auth) without
 * depending on actingAs(), which does not create a real token and breaks
 * AuthController::logout() (currentAccessToken() returns null).
 */
trait WithTenantSetup
{
    protected Tenant $tenant;
    protected User $schoolAdmin;
    protected User $teacher;
    protected string $tenantDomain;
    protected string $centralDomain;

    /** Real Sanctum tokens, created within the tenant schema context. */
    protected string $adminToken;
    protected string $teacherToken;

    /** Known plain-text password forced onto schoolAdmin in setUp (login tests). */
    protected string $adminPlainPassword = 'TestPassword123!';

    /** Original password hash, saved before override so it can be restored in tearDown. */
    protected string $adminOriginalPasswordHash;

    protected function setUpTenant(string $slug = 'demo'): void
    {
        $this->tenantDomain  = "{$slug}.enmaschool.com";
        $this->centralDomain = 'enmaschool.com';

        // Find tenant by slug in central DB
        $this->tenant = Tenant::where('slug', $slug)->firstOrFail();

        // Initialize tenant schema
        tenancy()->initialize($this->tenant);

        // Load test users from tenant schema
        $this->schoolAdmin = User::whereHas(
            'roles', fn ($q) => $q->where('name', 'school_admin')
        )->firstOrFail();

        $this->teacher = User::whereHas(
            'roles', fn ($q) => $q->where('name', 'teacher')
        )->firstOrFail();

        // Save original hash directly from DB (bypasses Eloquent's Hashed cast).
        // Force a known password so login tests are deterministic regardless of DB state.
        $this->adminOriginalPasswordHash = DB::table('users')
            ->where('id', $this->schoolAdmin->id)
            ->value('password');
        $this->schoolAdmin->forceFill(['password' => Hash::make($this->adminPlainPassword)])->save();

        // Create real Sanctum tokens — committed immediately (needed for HTTP requests).
        $this->adminToken   = $this->schoolAdmin->createToken('test-admin')->plainTextToken;
        $this->teacherToken = $this->teacher->createToken('test-teacher')->plainTextToken;

        // Begin a transaction on the tenant connection NOW, after setup writes are committed.
        // DatabaseTransactions only wraps the default 'pgsql' connection (initialized before
        // tenancy), so the 'tenant' connection is not covered. This manual transaction ensures
        // any data created during the test (e.g. classes via HTTP) is rolled back automatically.
        DB::beginTransaction();
    }

    protected function tearDownTenant(): void
    {
        // Roll back any test-created tenant data (classes, enrollments, etc.)
        DB::rollBack();

        // Revoke test tokens (committed before the transaction, so rollback doesn't remove them)
        if (isset($this->adminToken)) {
            $this->schoolAdmin->tokens()->where('name', 'test-admin')->delete();
        }
        if (isset($this->teacherToken)) {
            $this->teacher->tokens()->where('name', 'test-teacher')->delete();
        }

        // Restore original password hash directly (bypass Eloquent's Hashed cast, which
        // rejects a bcrypt hash whose cost differs from the test-env BCRYPT_ROUNDS=4).
        if (isset($this->adminOriginalPasswordHash)) {
            DB::table('users')
                ->where('id', $this->schoolAdmin->id)
                ->update(['password' => $this->adminOriginalPasswordHash]);
        }

        tenancy()->end();
    }

    // ── Auth helpers (return chained test instance) ───────────────────────────

    /**
     * Returns a test instance authenticated as school admin via real Bearer token.
     */
    protected function actingAsAdmin(): static
    {
        return $this->withToken($this->adminToken);
    }

    /**
     * Returns a test instance authenticated as teacher via real Bearer token.
     */
    protected function actingAsTeacher(): static
    {
        return $this->withToken($this->teacherToken);
    }

    // ── HTTP helpers (tenant domain) ─────────────────────────────────────────

    protected function tenantGetJson(string $path): TestResponse
    {
        return $this->getJson("http://{$this->tenantDomain}{$path}");
    }

    protected function tenantPostJson(string $path, array $data = []): TestResponse
    {
        return $this->postJson("http://{$this->tenantDomain}{$path}", $data);
    }

    protected function tenantPutJson(string $path, array $data = []): TestResponse
    {
        return $this->putJson("http://{$this->tenantDomain}{$path}", $data);
    }

    protected function tenantDeleteJson(string $path): TestResponse
    {
        return $this->deleteJson("http://{$this->tenantDomain}{$path}");
    }

    // ── HTTP helpers (central domain) ────────────────────────────────────────

    protected function centralPostJson(string $path, array $data = []): TestResponse
    {
        return $this->postJson("http://{$this->centralDomain}{$path}", $data);
    }

    protected function centralGetJson(string $path): TestResponse
    {
        return $this->getJson("http://{$this->centralDomain}{$path}");
    }
}
