<?php

declare(strict_types=1);

namespace Tests\Feature\Phase2;

use App\Models\Tenant\AcademicYear;
use App\Models\Tenant\Classe;
use App\Models\Tenant\SchoolLevel;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use Tests\Traits\WithTenantSetup;

/**
 * Phase 2 — Structure Académique
 *
 * Run: php artisan test tests/Feature/Phase2/AcademicStructureTest.php
 */
class AcademicStructureTest extends TestCase
{
    use DatabaseTransactions;
    use WithTenantSetup;

    private AcademicYear $year;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpTenant('demo');
        $this->year = AcademicYear::where('is_current', true)->firstOrFail();
    }

    protected function tearDown(): void
    {
        $this->tearDownTenant();
        parent::tearDown();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function level(string $code): SchoolLevel
    {
        return SchoolLevel::where('code', $code)->firstOrFail();
    }

    private function classePayload(string $code, ?string $serie = null, string $section = '1'): array
    {
        return [
            'academic_year_id' => $this->year->id,
            'school_level_id'  => $this->level($code)->id,
            'serie'            => $serie,
            'section'          => $section,
            'capacity'         => 30,
        ];
    }

    // ── STRUCT-001 : 6ème T1 → short_label "6ème" + section ──────────────────

    #[Test]
    public function sixieme_class_uses_short_label_as_display_name(): void
    {
        $response = $this->actingAsAdmin()
                         ->tenantPostJson('/api/school/classes', $this->classePayload('6EME', null, 'T1'));

        $response->assertStatus(201)
                 ->assertJsonPath('data.display_name', '6ème T1');
    }

    // ── STRUCT-002 : CM1 T2 ───────────────────────────────────────────────────

    #[Test]
    public function cm1_class_uses_short_label_as_display_name(): void
    {
        $response = $this->actingAsAdmin()
                         ->tenantPostJson('/api/school/classes', $this->classePayload('CM1', null, 'T2'));

        $response->assertStatus(201)
                 ->assertJsonPath('data.display_name', 'CM1 T2');
    }

    // ── STRUCT-003 : PS T3 ────────────────────────────────────────────────────

    #[Test]
    public function ps_class_uses_short_label_as_display_name(): void
    {
        $response = $this->actingAsAdmin()
                         ->tenantPostJson('/api/school/classes', $this->classePayload('PS', null, 'T3'));

        $response->assertStatus(201)
                 ->assertJsonPath('data.display_name', 'PS T3');
    }

    // ── STRUCT-005 : 1ère AT4 ─────────────────────────────────────────────────

    #[Test]
    public function premiere_with_serie_generates_correct_display_name(): void
    {
        $response = $this->actingAsAdmin()
                         ->tenantPostJson('/api/school/classes', $this->classePayload('1ERE', 'A', 'T4'));

        $response->assertStatus(201)
                 ->assertJsonPath('data.display_name', '1ère AT4');
    }

    // ── STRUCT-006 : Tle CT5 ──────────────────────────────────────────────────

    #[Test]
    public function terminale_with_serie_generates_correct_display_name(): void
    {
        $response = $this->actingAsAdmin()
                         ->tenantPostJson('/api/school/classes', $this->classePayload('TLE', 'C', 'T5'));

        $response->assertStatus(201)
                 ->assertJsonPath('data.display_name', 'Tle CT5');
    }

    // ── STRUCT-007 : 1ère sans série → 422 ────────────────────────────────────

    #[Test]
    public function creating_premiere_without_serie_returns_422(): void
    {
        $response = $this->actingAsAdmin()
                         ->tenantPostJson('/api/school/classes', [
                             'academic_year_id' => $this->year->id,
                             'school_level_id'  => $this->level('1ERE')->id,
                             'section'          => '1',
                             // serie intentionnellement absent
                         ]);

        $response->assertStatus(422);
    }

    // ── STRUCT-007b : 2nde sans série → 422 ──────────────────────────────────

    #[Test]
    public function creating_seconde_without_serie_returns_422(): void
    {
        $response = $this->actingAsAdmin()
                         ->tenantPostJson('/api/school/classes', [
                             'academic_year_id' => $this->year->id,
                             'school_level_id'  => $this->level('2NDE')->id,
                             'section'          => '1',
                         ]);

        $response->assertStatus(422);
    }

    // ── STRUCT-008 : Série ignorée pour niveaux non-lycée ────────────────────

    #[Test]
    public function serie_is_nullified_for_non_lycee_level(): void
    {
        $response = $this->actingAsAdmin()
                         ->tenantPostJson('/api/school/classes', [
                             'academic_year_id' => $this->year->id,
                             'school_level_id'  => $this->level('6EME')->id,
                             'section'          => 'A',
                             'serie'            => 'A', // ignorée
                         ]);

        $response->assertStatus(201);
        $this->assertNull($response->json('data.serie'));
    }

    // ── STRUCT-011 : Une seule année scolaire courante ────────────────────────

    #[Test]
    public function only_one_academic_year_can_be_current(): void
    {
        $count = AcademicYear::where('is_current', true)->count();

        $this->assertLessThanOrEqual(1, $count, 'Plus d\'une année scolaire est marquée comme courante.');
    }

    // ── generateDisplayName — tests unitaires ─────────────────────────────────

    #[Test]
    public function generate_display_name_without_serie_uses_short_label(): void
    {
        $level = $this->level('6EME'); // short_label = "6ème"
        $classe = new Classe(['school_level_id' => $level->id, 'section' => '2']);
        $classe->setRelation('level', $level);

        $this->assertSame('6ème 2', Classe::generateDisplayName($classe));
    }

    #[Test]
    public function generate_display_name_with_serie_uses_short_label_plus_serie_section(): void
    {
        $level = $this->level('TLE'); // short_label = "Tle", requires_serie = true
        $classe = new Classe(['school_level_id' => $level->id, 'serie' => 'D', 'section' => '1']);
        $classe->setRelation('level', $level);

        $this->assertSame('Tle D1', Classe::generateDisplayName($classe));
    }

    #[Test]
    public function generate_display_name_returns_empty_when_level_not_found(): void
    {
        $classe = new Classe(['school_level_id' => 99999, 'section' => '1']);

        $this->assertSame('', Classe::generateDisplayName($classe));
    }
}
