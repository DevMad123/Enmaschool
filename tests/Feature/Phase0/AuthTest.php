<?php

declare(strict_types=1);

namespace Tests\Feature\Phase0;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use Tests\Traits\WithTenantSetup;

/**
 * Phase 0 — Auth & Multi-tenant
 *
 * Run: php artisan test tests/Feature/Phase0/AuthTest.php
 */
class AuthTest extends TestCase
{
    use DatabaseTransactions;
    use WithTenantSetup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpTenant('demo');
    }

    protected function tearDown(): void
    {
        $this->tearDownTenant();
        parent::tearDown();
    }

    // ── AUTH-001 : Login super admin ─────────────────────────────────────────

    #[Test]
    public function super_admin_can_login_on_central_domain(): void
    {
        $response = $this->centralPostJson('/central/auth/login', [
            'email'    => 'superadmin@enmaschool.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => ['token', 'user']]);
    }

    // ── AUTH-002 : Login school admin (bon tenant) ──────────────────────────

    #[Test]
    public function school_admin_can_login_on_correct_tenant(): void
    {
        $response = $this->tenantPostJson('/api/auth/login', [
            'email'    => $this->schoolAdmin->email,
            'password' => $this->adminPlainPassword,
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'token',
                         'user' => ['id', 'email', 'role'],
                         'permissions',
                         'roles',
                     ],
                 ]);

        $this->assertSame($this->schoolAdmin->email, $response->json('data.user.email'));
    }

    // ── AUTH-003 : Mauvais password → 401 ───────────────────────────────────

    #[Test]
    public function login_with_wrong_password_returns_401(): void
    {
        $response = $this->tenantPostJson('/api/auth/login', [
            'email'    => 'admin@demo.com',
            'password' => 'wrong_password_xyz',
        ]);

        $response->assertStatus(401);
    }

    // ── AUTH-004 : Login sur un tenant inexistant → 404 ─────────────────────

    #[Test]
    public function login_on_nonexistent_tenant_domain_returns_error(): void
    {
        $response = $this->postJson('http://nonexistent.enmaschool.com/api/auth/login', [
            'email'    => 'admin@demo.com',
            'password' => 'password',
        ]);

        // Tenant not found → 404 (PreventAccessFromCentralDomains or tenant init fails)
        $response->assertStatus(404);
    }

    // ── AUTH-005 : GET /api/auth/me avec token valide → 200 ─────────────────

    #[Test]
    public function get_me_with_valid_token_returns_user_data(): void
    {
        $response = $this->actingAsAdmin()
                         ->tenantGetJson('/api/auth/me');

        $response->assertStatus(200)
                 ->assertJsonPath('data.user.email', $this->schoolAdmin->email);
    }

    // ── AUTH-006 : GET /api/auth/me sans token → 401 ────────────────────────

    #[Test]
    public function get_me_without_token_returns_401(): void
    {
        $response = $this->tenantGetJson('/api/auth/me');

        $response->assertStatus(401);
    }

    // ── AUTH-007 : POST /api/auth/logout → 200 ──────────────────────────────

    #[Test]
    public function logout_returns_200(): void
    {
        $response = $this->actingAsAdmin()
                         ->tenantPostJson('/api/auth/logout');

        $response->assertStatus(200);
    }

    // ── AUTH-008 : Token révoqué → 401 sur requête suivante ─────────────────

    #[Test]
    public function revoked_token_returns_401_on_next_request(): void
    {
        $plainToken = $this->schoolAdmin->createToken('test-device')->plainTextToken;

        // First request → 200
        $this->withToken($plainToken)
             ->getJson("http://{$this->tenantDomain}/api/auth/me")
             ->assertStatus(200);

        // Reset cached auth guard so next request re-authenticates from DB
        $this->app['auth']->forgetGuards();

        // Logout → revoke token
        $this->withToken($plainToken)
             ->postJson("http://{$this->tenantDomain}/api/auth/logout")
             ->assertStatus(200);

        // Reset again so Sanctum re-checks the (now deleted) token
        $this->app['auth']->forgetGuards();

        // Second request with same token → 401
        $this->withToken($plainToken)
             ->getJson("http://{$this->tenantDomain}/api/auth/me")
             ->assertStatus(401);
    }

    // ── AUTH-009 : Tenant suspendu → 403 ────────────────────────────────────

    #[Test]
    public function suspended_tenant_returns_403_on_protected_routes(): void
    {
        $originalStatus = $this->tenant->status;
        $this->tenant->update(['status' => 'suspended']);

        $response = $this->actingAsAdmin()
                         ->tenantGetJson('/api/auth/me');

        $this->tenant->update(['status' => $originalStatus]);

        $response->assertStatus(403);
    }

    // ── AUTH-010 : La réponse /me contient les données du bon tenant ─────────

    #[Test]
    public function me_returns_data_scoped_to_current_tenant(): void
    {
        $response = $this->actingAsAdmin()
                         ->tenantGetJson('/api/auth/me');

        $response->assertStatus(200);
        $this->assertSame($this->schoolAdmin->id, $response->json('data.user.id'));
    }
}
