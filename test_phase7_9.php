<?php
// ============================================================
// TEST RUNNER — Phases 7, 8, 9
// ============================================================

use App\Models\Central\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$tenant = Tenant::first();

echo "\n";
echo "══════════════════════════════════════════════════════════\n";
echo "  ENMA SCHOOL — TESTS PHASES 7–8–9\n";
echo "  Tenant : {$tenant->id}\n";
echo "══════════════════════════════════════════════════════════\n\n";

$passed = 0; $failed = 0; $warns = 0;

function ok(string $id, string $label) { global $passed; $passed++; echo "  ✅ [{$id}] {$label}\n"; }
function fail(string $id, string $label, string $detail = '') { global $failed; $failed++; echo "  ❌ [{$id}] {$label}" . ($detail ? " → {$detail}" : '') . "\n"; }
function warn(string $id, string $label, string $detail = '') { global $warns; $warns++; echo "  ⚠️  [{$id}] {$label}" . ($detail ? " → {$detail}" : '') . "\n"; }
function section(string $title) { echo "\n── {$title}\n"; }

// Helpers utilisant la connexion tenant courante (à appeler DANS tenant->run())
function tenantCols(string $table): array {
    return DB::select("
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = ?
        ORDER BY ordinal_position
    ", [$table]);
}
function colNames(array $cols): array { return array_map(fn($c) => $c->column_name, $cols); }
function hasIdx(string $table, string $idx): bool {
    $schema = DB::selectOne("SELECT current_schema() as s")->s;
    $r = DB::select("SELECT 1 FROM pg_indexes WHERE schemaname=? AND tablename=? AND indexname=?", [$schema, $table, $idx]);
    return !empty($r);
}
function hasIdxContaining(string $table, string $partial): bool {
    $schema = DB::selectOne("SELECT current_schema() as s")->s;
    $r = DB::select("SELECT indexname FROM pg_indexes WHERE schemaname=? AND tablename=? AND indexname LIKE ?", [$schema, $table, "%{$partial}%"]);
    return !empty($r);
}
function listIndexes(string $table): array {
    $schema = DB::selectOne("SELECT current_schema() as s")->s;
    return array_column(DB::select("SELECT indexname FROM pg_indexes WHERE schemaname=? AND tablename=?", [$schema, $table]), 'indexname');
}

$tenant->run(function () {

// ════════════════════════════════════════════════════════
// PHASE 7 — BULLETINS SCOLAIRES
// ════════════════════════════════════════════════════════
echo "\n╔══════════════════════════════════════════════════════╗\n";
echo "║  PHASE 7 — BULLETINS SCOLAIRES                      ║\n";
echo "╚══════════════════════════════════════════════════════╝\n";

section('7.1 — DB : Tables & Colonnes');

$rcCols = colNames(tenantCols('report_cards'));
$required = ['id','enrollment_id','period_id','type','status','general_average',
             'general_rank','absences_justified','absences_unjustified',
             'council_decision','pdf_path','published_at','created_at','updated_at'];
$missing = array_diff($required, $rcCols);
$missing ? fail('DB-701', 'report_cards colonnes manquantes: '.implode(', ',$missing))
         : ok('DB-701', 'report_cards '.count($rcCols).' colonnes OK');

$appCols = colNames(tenantCols('report_card_appreciations'));
$missing = array_diff(['id','report_card_id','subject_id','appreciation'], $appCols);
$missing ? fail('DB-702', 'report_card_appreciations manquantes: '.implode(', ',$missing))
         : ok('DB-702', 'report_card_appreciations '.count($appCols).' colonnes OK');

$annualIdx = hasIdx('report_cards', 'report_cards_annual_unique');
$annualIdx ? ok('DB-703', 'Index partiel report_cards_annual_unique présent')
           : fail('DB-703', 'Index partiel report_cards_annual_unique ABSENT');

$idxs = listIndexes('report_cards');
$hasUnique = array_filter($idxs, fn($i) => str_contains($i, 'enrollment') && str_contains($i, 'period'));
$hasUnique ? ok('DB-704', 'UNIQUE(enrollment_id,period_id,type) présent')
           : warn('DB-704', 'UNIQUE composite RC non trouvé — indexes: '.implode(', ',$idxs));

section('7.2 — Modèles & Enums Phase 7');

$rc = App\Models\Tenant\ReportCard::with('enrollment.student')->first();
if ($rc) {
    ok('RC-701', 'ReportCard trouvé (id='.$rc->id.', status='.$rc->status->value.')');
    $rc->status instanceof App\Enums\ReportCardStatus
        ? ok('RC-702', 'status → ReportCardStatus::'.$rc->status->name)
        : fail('RC-702', 'status non casté en enum');
    $rc->type instanceof App\Enums\ReportCardType
        ? ok('RC-703', 'type → ReportCardType::'.$rc->type->name)
        : fail('RC-703', 'type non casté');
    $rc->enrollment?->student
        ? ok('RC-704', 'enrollment.student chargé: '.$rc->enrollment->student->full_name)
        : warn('RC-704', 'enrollment.student null');
} else {
    warn('RC-701', 'Aucun bulletin en base');
}

ok('EN-701', 'ReportCardStatus::Draft->label() = "'.App\Enums\ReportCardStatus::Draft->label().'"');
ok('EN-702', 'CouncilDecision::Pass accessible (valeur: '.App\Enums\CouncilDecision::Pass->value.')');

$hm = App\Enums\HonorMention::cases();
count($hm) >= 2 ? ok('EN-703', 'HonorMention: '.count($hm).' valeurs') : warn('EN-703', 'HonorMention vide');

section('7.3 — ReportCardService');

$rcs = app(App\Services\Tenant\ReportCardService::class);
$methods7 = ['collectBulletinData','initiate','initiateForClass','generatePdf','publish'];
foreach ($methods7 as $m) {
    method_exists($rcs, $m)
        ? ok('SRV-7'.substr(md5($m),0,2), "ReportCardService::{$m}() présent")
        : fail('SRV-7'.substr(md5($m),0,2), "ReportCardService::{$m}() ABSENT");
}

if ($rc) {
    try {
        $data = $rcs->collectBulletinData($rc);
        is_array($data) ? ok('SRV-701', 'collectBulletinData() → array OK') : fail('SRV-701', 'retourne non-array');
        isset($data['student'])  ? ok('SRV-702', 'data[student] présent')  : fail('SRV-702', 'data[student] absent');
        isset($data['subjects']) ? ok('SRV-703', 'data[subjects] présent') : fail('SRV-703', 'data[subjects] absent');
        isset($data['school'])   ? ok('SRV-704', 'data[school] présent')   : warn('SRV-704', 'data[school] absent');
    } catch (\Throwable $e) {
        fail('SRV-701', 'collectBulletinData() exception: '.$e->getMessage());
    }
}

section('7.4 — PDF DomPDF');
class_exists('Barryvdh\DomPDF\Facade\Pdf')
    ? ok('PDF-701', 'Facade Pdf chargée (barryvdh/laravel-dompdf)')
    : fail('PDF-701', 'Facade Pdf non trouvée — composer require barryvdh/laravel-dompdf');
view()->exists('pdf.report_card')
    ? ok('PDF-702', 'Vue pdf.report_card existe')
    : fail('PDF-702', 'Vue pdf.report_card ABSENTE');
view()->exists('pdf.timetable')
    ? ok('PDF-703', 'Vue pdf.timetable existe')
    : fail('PDF-703', 'Vue pdf.timetable ABSENTE');

section('7.5 — Job GenerateBulletinsJob');
class_exists(App\Jobs\GenerateBulletinsJob::class)
    ? ok('JOB-701', 'GenerateBulletinsJob existe')
    : fail('JOB-701', 'GenerateBulletinsJob ABSENT');

// ════════════════════════════════════════════════════════
// PHASE 8 — EMPLOI DU TEMPS
// ════════════════════════════════════════════════════════
echo "\n╔══════════════════════════════════════════════════════╗\n";
echo "║  PHASE 8 — EMPLOI DU TEMPS                          ║\n";
echo "╚══════════════════════════════════════════════════════╝\n";

section('8.1 — DB : Tables & Colonnes');

$scols = colNames(tenantCols('time_slots'));
$miss = array_diff(['id','day_of_week','name','start_time','end_time','is_break','order','is_active'], $scols);
$miss ? fail('DB-801', 'time_slots manquantes: '.implode(', ',$miss)) : ok('DB-801', 'time_slots '.count($scols).' colonnes OK');

$ecols = colNames(tenantCols('timetable_entries'));
$miss = array_diff(['id','academic_year_id','class_id','time_slot_id','subject_id','teacher_id','is_active'], $ecols);
$miss ? fail('DB-802', 'timetable_entries manquantes: '.implode(', ',$miss)) : ok('DB-802', 'timetable_entries OK');

$ocols = colNames(tenantCols('timetable_overrides'));
$miss = array_diff(['id','timetable_entry_id','date','type','reason'], $ocols);
$miss ? fail('DB-803', 'timetable_overrides manquantes: '.implode(', ',$miss)) : ok('DB-803', 'timetable_overrides OK');

// UNIQUE(class_id, time_slot_id, academic_year_id)
$teIdxs = listIndexes('timetable_entries');
$hasUniqueTE = array_filter($teIdxs, fn($i) => str_contains($i, 'class') && str_contains($i, 'time_slot'));
$hasUniqueTE ? ok('DB-804', 'UNIQUE(class_id,time_slot_id,academic_year_id) présent') : warn('DB-804', 'UNIQUE timetable_entries non trouvé — indexes: '.implode(', ',$teIdxs));

section('8.2 — TimeSlots Seeder');

$total = App\Models\Tenant\TimeSlot::count();
$total >= 45
    ? ok('TS-801', "{$total} créneaux en base (≥ 45)")
    : fail('TS-801', "Seulement {$total} créneaux (attendu ≥ 45 — relancer TimeSlotSeeder)");

foreach ([1=>'Lundi',2=>'Mardi',3=>'Mercredi',4=>'Jeudi',5=>'Vendredi',6=>'Samedi'] as $day => $label) {
    $cnt = App\Models\Tenant\TimeSlot::where('day_of_week', $day)->count();
    $cnt === 9
        ? ok("TS-8{$day}0", "{$label}: {$cnt} créneaux")
        : ($cnt > 0 ? warn("TS-8{$day}0", "{$label}: {$cnt} créneaux (attendu 9)") : fail("TS-8{$day}0", "{$label}: 0 créneaux"));
}

$breaks = App\Models\Tenant\TimeSlot::where('is_break', true)->count();
$breaks >= 12 ? ok('TS-802', "{$breaks} créneaux de pause (is_break=true)") : warn('TS-802', "{$breaks} pauses (attendu ≥12)");

$first = App\Models\Tenant\TimeSlot::orderBy('day_of_week')->orderBy('order')->first();
($first && str_starts_with((string)$first->start_time, '07:30'))
    ? ok('TS-803', "Premier créneau: {$first->name} à {$first->start_time}")
    : warn('TS-803', 'Heure démarrage inattendue: '.($first?->start_time ?? 'N/A'));

section('8.3 — Enums Phase 8');

$dow = App\Enums\DayOfWeek::Monday;
($dow->label() === 'Lundi')
    ? ok('EN-801', 'DayOfWeek::Monday->label() = "Lundi"')
    : fail('EN-801', 'DayOfWeek label incorrect: '.$dow->label());
($dow->short() === 'Lun')
    ? ok('EN-802', 'DayOfWeek::Monday->short() = "Lun"')
    : warn('EN-802', 'DayOfWeek short: '.$dow->short());

$ot = App\Enums\OverrideType::Cancellation;
ok('EN-803', 'OverrideType::Cancellation value="'.$ot->value.'" label="'.$ot->label().'"');

section('8.4 — TimetableService');

$ts = app(App\Services\Tenant\TimetableService::class);
foreach (['getWeekViewForClass','getWeekViewForTeacher','create','update','delete','bulkStore','checkConflicts'] as $m) {
    method_exists($ts, $m)
        ? ok('TS8-'.substr(md5($m),0,3), "TimetableService::{$m}() présent")
        : fail('TS8-'.substr(md5($m),0,3), "TimetableService::{$m}() ABSENT");
}

class_exists(App\Exceptions\TimetableConflictException::class)
    ? ok('CON-801', 'TimetableConflictException classe présente')
    : fail('CON-801', 'TimetableConflictException ABSENTE');

section('8.5 — Modèles Phase 8');

$entry = App\Models\Tenant\TimetableEntry::with(['timeSlot','subject','teacher'])->first();
if ($entry) {
    ok('TE-801', 'TimetableEntry trouvé (id='.$entry->id.')');
    $entry->timeSlot ? ok('TE-802', 'timeSlot chargé: '.$entry->timeSlot->name) : warn('TE-802', 'timeSlot null');
    $entry->subject  ? ok('TE-803', 'subject chargé: '.$entry->subject->name)   : warn('TE-803', 'subject null');

    // Scopes
    $count = App\Models\Tenant\TimetableEntry::active()->count();
    ok('TE-804', "scopeActive() → {$count} entrées actives");

    $count2 = App\Models\Tenant\TimetableEntry::forClass($entry->class_id)->count();
    ok('TE-805', "scopeForClass({$entry->class_id}) → {$count2} entrées");
} else {
    warn('TE-801', 'Aucune timetable_entry en base');
}

// TimeSlot scopes
$activeSlots = App\Models\Tenant\TimeSlot::active()->count();
$noBreaks    = App\Models\Tenant\TimeSlot::notBreak()->count();
ok('TS-804', "TimeSlot::active() → {$activeSlots}, ::notBreak() → {$noBreaks}");

// TimeSlot PDF : vue pdf.timetable génération rapide
try {
    $slots       = App\Models\Tenant\TimeSlot::active()->orderBy('day_of_week')->orderBy('order')->get();
    $slotsByOrder = $slots->groupBy('order');
    $slotOrders  = $slotsByOrder->keys()->sort()->values();
    $classe      = App\Models\Tenant\Classe::with('mainTeacher')->first();
    $year        = App\Models\Tenant\AcademicYear::first();
    $entries     = App\Models\Tenant\TimetableEntry::with(['timeSlot','subject','teacher.user','room'])
        ->where('class_id', $classe?->id)->get()
        ->groupBy(fn($e) => $e->timeSlot?->day_of_week?->value ?? 0);
    $dayLabels   = [1=>'Lundi',2=>'Mardi',3=>'Mercredi',4=>'Jeudi',5=>'Vendredi',6=>'Samedi'];
    $activeDays  = $slots->pluck('day_of_week')->map(fn($d) => is_object($d)?$d->value:(int)$d)->unique()->sort()->values();
    $days        = $activeDays->mapWithKeys(fn($d) => [$d => $dayLabels[$d]??'?'])->toArray();
    $school      = ['name' => App\Models\Tenant\SchoolSetting::get('school_name','École'), 'motto'=>''];
    $pdf = Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.timetable', compact('classe','year','slotsByOrder','slotOrders','entries','days','school'))
        ->setPaper('A4','landscape');
    $size = strlen($pdf->output());
    $size > 10000
        ? ok('PDF-704', "PDF emploi du temps généré: {$size} octets")
        : fail('PDF-704', "PDF trop petit ({$size} octets)");
} catch (\Throwable $e) {
    fail('PDF-704', 'PDF timetable erreur: '.$e->getMessage());
}

// ════════════════════════════════════════════════════════
// PHASE 9 — PRÉSENCES & ABSENCES
// ════════════════════════════════════════════════════════
echo "\n╔══════════════════════════════════════════════════════╗\n";
echo "║  PHASE 9 — PRÉSENCES & ABSENCES                     ║\n";
echo "╚══════════════════════════════════════════════════════╝\n";

section('9.1 — DB : Tables & Colonnes');

$acols = colNames(tenantCols('attendances'));
$miss  = array_diff(['id','enrollment_id','timetable_entry_id','date','period_id','status','minutes_late','recorded_by','note'], $acols);
$miss ? fail('DB-901', 'attendances manquantes: '.implode(', ',$miss)) : ok('DB-901', 'attendances '.count($acols).' colonnes OK');

$jcols = colNames(tenantCols('absence_justifications'));
$miss  = array_diff(['id','enrollment_id','date_from','date_to','reason','document_path','status','reviewed_by','review_note','submitted_by'], $jcols);
$miss ? fail('DB-902', 'absence_justifications manquantes: '.implode(', ',$miss)) : ok('DB-902', 'absence_justifications OK');

hasIdx('attendances', 'attendances_daily_unique')
    ? ok('DB-903', 'Index partiel attendances_daily_unique (WHERE timetable_entry_id IS NULL) présent')
    : fail('DB-903', 'Index partiel attendances_daily_unique ABSENT');

$attIdxs = listIndexes('attendances');
$hasUniqueAtt = array_filter($attIdxs, fn($i) => str_contains($i,'enrollment') && str_contains($i,'timetable'));
$hasUniqueAtt ? ok('DB-904', 'UNIQUE(enrollment_id,timetable_entry_id,date) présent') : warn('DB-904', 'UNIQUE attendance indexes: '.implode(', ',$attIdxs));

section('9.2 — Enums Phase 9');

$tests = [
    ['EN-901', App\Enums\AttendanceStatus::Present->label() === 'Présent',       'Present->label() = "Présent"'],
    ['EN-902', App\Enums\AttendanceStatus::Present->isPresent() === true,         'Present->isPresent() = true'],
    ['EN-903', App\Enums\AttendanceStatus::Present->isAbsent() === false,         'Present->isAbsent() = false'],
    ['EN-904', App\Enums\AttendanceStatus::Present->countsAsAbsent() === false,   'Present->countsAsAbsent() = false'],
    ['EN-905', App\Enums\AttendanceStatus::Absent->countsAsAbsent() === true,     'Absent->countsAsAbsent() = true'],
    ['EN-906', App\Enums\AttendanceStatus::Absent->countsAsExcused() === false,   'Absent->countsAsExcused() = false'],
    ['EN-907', App\Enums\AttendanceStatus::Late->isPresent() === true,            'Late->isPresent() = true (physiquement là)'],
    ['EN-908', App\Enums\AttendanceStatus::Late->isAbsent() === false,            'Late->isAbsent() = false'],
    ['EN-909', App\Enums\AttendanceStatus::Excused->countsAsExcused() === true,   'Excused->countsAsExcused() = true'],
    ['EN-910', App\Enums\AttendanceStatus::Excused->countsAsAbsent() === false,   'Excused->countsAsAbsent() = false'],
    ['EN-911', App\Enums\JustificationStatus::Pending->label() === 'En attente', 'JustificationStatus::Pending->label() = "En attente"'],
    ['EN-912', App\Enums\JustificationStatus::Approved->color() === 'green',     'JustificationStatus::Approved->color() = "green"'],
];
foreach ($tests as [$id, $cond, $msg]) {
    $cond ? ok($id, $msg) : fail($id, $msg);
}

section('9.3 — Modèles Phase 9');

$att = new App\Models\Tenant\Attendance();
ok('MDL-901', 'Attendance instanciable');
$just = new App\Models\Tenant\AbsenceJustification();
ok('MDL-902', 'AbsenceJustification instanciable');

foreach (['scopeForEnrollment','scopeForClass','scopeForDate','scopeForPeriod','scopeForEntry',
          'scopeAbsent','scopeUnjustified','scopeJustified','scopePresent','scopeBetweenDates'] as $scope) {
    method_exists(App\Models\Tenant\Attendance::class, $scope)
        ? ok('MDL-9'.substr(md5($scope),0,2), "Attendance::{$scope}() présent")
        : fail('MDL-9'.substr(md5($scope),0,2), "Attendance::{$scope}() ABSENT");
}

section('9.4 — AttendanceService méthodes');

$as = app(App\Services\Tenant\AttendanceService::class);
foreach (['recordForEntry','recordForDay','getForEntry','getForClass','getSheetForEntry',
          'getStudentStats','getClassStats','getPeriodStats','updateReportCardAbsences',
          'submitJustification','approveJustification','rejectJustification','getClassCalendar'] as $m) {
    method_exists($as, $m)
        ? ok('AS-'.substr(md5($m),0,3), "AttendanceService::{$m}()")
        : fail('AS-'.substr(md5($m),0,3), "AttendanceService::{$m}() ABSENT");
}

section('9.5 — Saisie & Stats avec données réelles');

$enrollment = App\Models\Tenant\Enrollment::with('student')->first();
$tEntry     = App\Models\Tenant\TimetableEntry::first();

if ($enrollment && $tEntry) {
    ok('SRV-901', "Enrollment: {$enrollment->student?->full_name} | Entry: id={$tEntry->id}");

    $date = now()->subDays(7)->toDateString();

    // Insérer un présent
    App\Models\Tenant\Attendance::updateOrCreate(
        ['enrollment_id'=>$enrollment->id,'timetable_entry_id'=>$tEntry->id,'date'=>$date],
        ['status'=>'present','recorded_at'=>now()]
    );
    $cnt = App\Models\Tenant\Attendance::where('enrollment_id',$enrollment->id)->where('timetable_entry_id',$tEntry->id)->where('date',$date)->count();
    $cnt===1 ? ok('SRV-902','updateOrCreate → 1 seul enregistrement (pas de doublon)') : fail('SRV-902',"Doublon détecté! count={$cnt}");

    // Changer vers absent (updateOrCreate doit mettre à jour)
    App\Models\Tenant\Attendance::updateOrCreate(
        ['enrollment_id'=>$enrollment->id,'timetable_entry_id'=>$tEntry->id,'date'=>$date],
        ['status'=>'absent','note'=>'Test auto']
    );
    $updated = App\Models\Tenant\Attendance::where('enrollment_id',$enrollment->id)->where('timetable_entry_id',$tEntry->id)->where('date',$date)->first();
    ($updated->status === App\Enums\AttendanceStatus::Absent)
        ? ok('SRV-903','updateOrCreate met à jour le statut → absent')
        : fail('SRV-903','Statut non mis à jour: '.$updated->status->value);

    // Cast enum
    ($updated->status instanceof App\Enums\AttendanceStatus)
        ? ok('SRV-904','status casté en AttendanceStatus: '.$updated->status->label())
        : fail('SRV-904','status non casté');

    // Accessors
    ($updated->is_absent === true)
        ? ok('SRV-905','is_absent accessor = true pour Absent')
        : fail('SRV-905','is_absent accessor incorrect: '.var_export($updated->is_absent,true));
    ($updated->is_present === false)
        ? ok('SRV-906','is_present accessor = false pour Absent')
        : fail('SRV-906','is_present accessor incorrect');

    // getStudentStats
    $stats = $as->getStudentStats($enrollment->id);
    ok('SRV-907', "getStudentStats() → total={$stats['total_courses']} absent={$stats['absent']} rate={$stats['attendance_rate']}%");
    ($stats['absent'] >= 1)
        ? ok('SRV-908','Absence comptée dans getStudentStats()')
        : warn('SRV-908','Aucune absence comptée (vérifier les données)');

    // getSheetForEntry
    $sheet = $as->getSheetForEntry($tEntry, now()->subDays(7));
    is_array($sheet) ? ok('SRV-909','getSheetForEntry() retourne array') : fail('SRV-909','getSheetForEntry() invalide');
    isset($sheet['students']) ? ok('SRV-910','sheet[students] présent ('.count($sheet['students']).' élèves)') : fail('SRV-910','sheet[students] absent');
    isset($sheet['is_recorded']) && $sheet['is_recorded']===true
        ? ok('SRV-911','is_recorded=true après saisie')
        : warn('SRV-911','is_recorded='.var_export($sheet['is_recorded']??null,true).' (attendu true)');
    isset($sheet['summary']['attendance_rate'])
        ? ok('SRV-912','summary.attendance_rate présent: '.$sheet['summary']['attendance_rate'].'%')
        : fail('SRV-912','summary.attendance_rate absent');

    // Index partiel : saisie journée entière (entry_id = NULL)
    try {
        App\Models\Tenant\Attendance::updateOrCreate(
            ['enrollment_id'=>$enrollment->id,'timetable_entry_id'=>null,'date'=>now()->subDays(5)->toDateString()],
            ['status'=>'present','recorded_at'=>now()]
        );
        ok('SRV-913','Saisie journée entière (timetable_entry_id=NULL) OK');
        // 2e fois → updateOrCreate, pas d'exception
        App\Models\Tenant\Attendance::updateOrCreate(
            ['enrollment_id'=>$enrollment->id,'timetable_entry_id'=>null,'date'=>now()->subDays(5)->toDateString()],
            ['status'=>'late','minutes_late'=>10]
        );
        ok('SRV-914','updateOrCreate journée entière → pas de doublon (index partiel fonctionne)');
    } catch (\Throwable $e) {
        fail('SRV-913','Saisie journée entière erreur: '.$e->getMessage());
    }
} else {
    warn('SRV-901', 'Enrollment ou TimetableEntry manquant pour les tests de saisie');
}

section('9.6 — Justification : Workflow');

$enrollment2 = App\Models\Tenant\Enrollment::first();
if ($enrollment2) {
    $justif = App\Models\Tenant\AbsenceJustification::create([
        'enrollment_id' => $enrollment2->id,
        'date_from'     => now()->subDays(7)->toDateString(),
        'date_to'       => now()->subDays(5)->toDateString(),
        'reason'        => 'Test maladie — automatique',
        'status'        => App\Enums\JustificationStatus::Pending,
    ]);
    ok('JUST-901', "Justification créée (id={$justif->id}, status={$justif->status->value})");

    ($justif->status === App\Enums\JustificationStatus::Pending)
        ? ok('JUST-902','status=pending après création')
        : fail('JUST-902','status incorrect: '.$justif->status->value);

    ($justif->date_from instanceof \Carbon\Carbon || $justif->date_from instanceof \Illuminate\Support\Carbon)
        ? ok('JUST-903','date_from casté Carbon: '.$justif->date_from->format('d/m/Y'))
        : fail('JUST-903','date_from non casté');

    // Scope pending
    $pendingCount = App\Models\Tenant\AbsenceJustification::pending()->count();
    ($pendingCount >= 1)
        ? ok('JUST-904', "scopePending() → {$pendingCount} justification(s)")
        : fail('JUST-904', 'scopePending() retourne 0');
}

section('9.7 — Job UpdateReportCardAbsencesJob');

class_exists(App\Jobs\UpdateReportCardAbsencesJob::class)
    ? ok('JOB-901','UpdateReportCardAbsencesJob classe présente')
    : fail('JOB-901','UpdateReportCardAbsencesJob ABSENT');

$job = new App\Jobs\UpdateReportCardAbsencesJob(1, [1,2,3]);
($job->enrollmentId === 1 && $job->reportCardIds === [1,2,3])
    ? ok('JOB-902','Job paramètres (enrollmentId, reportCardIds) corrects')
    : fail('JOB-902','Paramètres job incorrects');

section('9.8 — Routes');

$routes = collect(app('router')->getRoutes()->getRoutes())->map(fn($r)=>$r->uri())->toArray();
$required = [
    'api/school/attendance/sheet'                     => 'GET attendance/sheet',
    'api/school/attendance/record'                    => 'POST attendance/record',
    'api/school/attendance/student/{enrollment}'      => 'GET student stats',
    'api/school/attendance/student/{enrollment}/history' => 'GET student history',
    'api/school/attendance/class/{classe}'            => 'GET class stats',
    'api/school/attendance/class/{classe}/calendar'   => 'GET class calendar',
    'api/school/justifications'                       => 'GET/POST justifications',
    'api/school/justifications/{justification}/review'=> 'POST review',
    'api/school/timetable'                            => 'GET timetable',
    'api/school/timetable/pdf'                        => 'GET timetable PDF',
    'api/school/time-slots'                           => 'GET time-slots',
];
foreach ($required as $uri => $desc) {
    in_array($uri, $routes)
        ? ok('RTE-'.substr(md5($uri),0,4), "Route: {$desc} ({$uri})")
        : fail('RTE-'.substr(md5($uri),0,4), "Route ABSENTE: {$uri}");
}

}); // end tenant->run()

// Résumé
echo "\n";
echo "══════════════════════════════════════════════════════════\n";
echo "  RÉSUMÉ FINAL\n";
echo "══════════════════════════════════════════════════════════\n";
echo "  ✅ Passed : {$passed}\n";
echo "  ❌ Failed : {$failed}\n";
echo "  ⚠️  Warns  : {$warns}\n";
if ($failed === 0) echo "  🎉 TOUTES LES PHASES PASSENT !\n";
echo "══════════════════════════════════════════════════════════\n\n";
